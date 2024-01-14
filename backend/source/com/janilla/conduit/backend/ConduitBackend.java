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
import com.janilla.io.IO;
import com.janilla.persistence.Persistence;
import com.janilla.persistence.PersistenceBuilder;
import com.janilla.util.Lazy;
import com.janilla.util.Randomize;
import com.janilla.util.Util;
import com.janilla.web.AnnotationDrivenToMethodInvocation;

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
		s.setHandler(b.getHandler());
		s.serve();
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
		b.setTypes(() -> Util.getPackageClasses("com.janilla.conduit.backend").iterator());
		b.setPersistence(CustomPersistence::new);
		return b.build();
	});

	AnnotationDrivenToMethodInvocation toInvocation;

	Supplier<IO.Consumer<ExchangeContext>> handler = Lazy.of(() -> {
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

	public AnnotationDrivenToMethodInvocation getToInvocation() {
		return toInvocation;
	}

	public IO.Consumer<ExchangeContext> getHandler() {
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
		if (e.count() > 0)
			return;
		var f = p.getCrud(User.class);
		var r = ThreadLocalRandom.current();
		var w = new ArrayList<>(Validation.safeWords);
		var tags = Randomize.elements(5, 15, w).distinct().toList();
		for (var j = r.nextInt(10, 16); j > 0; j--) {
			var u = new User();
			var n = Randomize.sentence(2, 2, () -> Randomize.element(w));
			u.setUsername(n);
			u.setEmail(n.replace(' ', '@'));
			UserApi.setHashAndSalt(u, n.substring(0, n.indexOf(' ')));
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
}
