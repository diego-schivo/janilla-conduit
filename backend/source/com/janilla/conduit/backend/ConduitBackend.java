/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package com.janilla.conduit.backend;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Properties;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

import com.janilla.http.ExchangeContext;
import com.janilla.http.HttpHandler;
import com.janilla.io.IO;
import com.janilla.persistence.Persistence;
import com.janilla.persistence.PersistenceBuilder;
import com.janilla.util.Lazy;
import com.janilla.util.Randomize;
import com.janilla.util.Util;
import com.janilla.web.AnnotationDrivenToInvocation;

public class ConduitBackend {

	public static void main(String[] args) throws IOException {
		var c = new Properties();
		try (var s = ConduitBackend.class.getResourceAsStream("configuration.properties")) {
			c.load(s);
		}

		var b = new ConduitBackend();
		b.setConfiguration(c);
		b.populate();

		var s = new CustomHttpServer();
		s.backend = b;
		s.setExecutor(Runnable::run);
		s.setPort(Integer.parseInt(c.getProperty("conduit.backend.http.port")));
		s.serve(b.getHandler());
	}

	Properties configuration;

	IO.Supplier<Persistence> persistence = IO.Lazy.of(() -> {
		var b = new PersistenceBuilder();
		{
			var p = configuration.getProperty("conduit.backend.database.path");
			if (p.startsWith("~"))
				p = System.getProperty("user.home") + p.substring(1);
			b.setFile(Path.of(p));
		}
		b.setTypes(() -> Util.getPackageClasses("com.janilla.conduit.backend"));
		b.setPersistence(CustomPersistence::new);
		return b.build();
	});

//	Supplier<HttpServer> httpServer = Lazy.of(() -> {
//		var s = new CustomHttpServer();
//		s.backend = this;
//		s.setExecutor(Runnable::run);
//		s.setPort(Integer.parseInt(configuration.getProperty("conduit.backend.http.port")));
//		return s;
//	});

	AnnotationDrivenToInvocation toEndpointInvocation;

//	Supplier<HandlerFactory> handlerFactory = Lazy.of(() -> {
//		var f1 = new MethodHandlerFactory();
//		{
//			var i = new CustomAnnotationDrivenToInvocation();
//			i.setTypes(() -> Util.getPackageClasses("com.janilla.conduit.backend"));
//			i.backend = this;
//			f1.setToInvocation(i);
//			toEndpointInvocation = i;
//		}
//		{
//			var r = new CustomMethodArgumentsResolver();
//			r.backend = this;
//			f1.setArgumentsResolver(r);
//		}
//
//		var f2 = new CustomJsonHandlerFactory();
//		f2.backend = this;
//
//		var f3 = new CustomExceptionHandlerFactory();
//
//		var f = new DelegatingHandlerFactory();
//		{
//			var a = new HandlerFactory[] { f1, f2, f3 };
//			f.setToHandler(o -> {
//				for (var g : a) {
//					var h = g.createHandler(o);
//					if (h != null)
//						return h;
//				}
//				return null;
//			});
//		}
//		f1.setRenderFactory(f);
//		return f;
//	});
	Supplier<HttpHandler> handler = Lazy.of(() -> {
		var b = new CustomApplicationHandlerBuilder();
		b.setApplication(ConduitBackend.this);
		return b.build();
	});

	public Properties getConfiguration() {
		return configuration;
	}

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	public Persistence getPersistence() {
		try {
			return persistence.get();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

//	public HttpServer getHttpServer() {
//		return httpServer.get();
//	}

	public AnnotationDrivenToInvocation getToEndpointInvocation() {
		return toEndpointInvocation;
	}

//	public HandlerFactory getHandlerFactory() {
//		return handlerFactory.get();
//	}

	public HttpHandler getHandler() {
		return handler.get();
	}

	public ExchangeContext newExchangeContext() {
		var c = new CustomExchangeContext();
		c.backend = this;
		return c;
	}

	public void populate() throws IOException {
		var p = persistence.get();
		var e = p.getCrud(Article.class);
//		System.out.println("e=" + e);
		if (e.count() > 0)
			return;
		var f = p.getCrud(User.class);
		var r = ThreadLocalRandom.current();
		var w = new ArrayList<>(Validation.safeWords);
		var tags = Randomize.elements(5, 15, w).distinct().toList();
		for (var j = r.nextInt(10, 16); j > 0; j--) {
			var u = new User();
			u.setUsername(Randomize.sentence(2, 2, () -> Randomize.element(w)));
			u.setEmail(u.getUsername().replace(' ', '.') + "@example.com");
			UserApi.setHashAndSalt(u, "123456");
//			u.setImage("https://api.realworld.io/images/smiley-cyrus.jpeg");
			u.setImage(
					"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><text x='2' y='12.5' font-size='12'>"
							+ new String(Character.toChars(0x1F600 + r.nextInt(0x50))) + "</text></svg>");
			f.create(u);
			for (var k = r.nextInt(1, 21); k > 0; k--) {
				var a = new Article();
				a.setAuthor(u.getId());
				a.setTitle(Randomize.sentence(2, 6, () -> Randomize.element(w)));
				a.setSlug(a.getTitle().toLowerCase().replace(' ', '-'));
				a.setDescription(Randomize.sentence(3, 10, () -> Randomize.element(w)));
				a.setBody(Randomize.sentence(10, 20, () -> Randomize.element(w)));
				a.setTagList(Randomize.elements(1, 5, tags).distinct().toList());
				a.setCreatedAt(Randomize.instant(OffsetDateTime.of(2020, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC).toInstant(),
						OffsetDateTime.now(ZoneOffset.UTC).toInstant()));
				p.getCrud(Article.class).create(a);
			}
		}
	}

//	public void serve() throws IOException {
//		httpServer.get().serve(c -> {
//			var o = c.getException() != null ? c.getException() : c.getRequest();
//			var h = handlerFactory.get().createHandler(o);
//			if (h == null)
//				throw new NotFoundException();
//			h.handle(c);
//		});
//	}
}
