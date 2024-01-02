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
package com.janilla.conduit.frontend;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Properties;
import java.util.function.Supplier;
import java.util.stream.Stream;

import com.janilla.http.HttpServer;
import com.janilla.io.IO;
import com.janilla.util.Lazy;
import com.janilla.util.Util;
import com.janilla.web.DelegatingHandlerFactory;
import com.janilla.web.Handler;
import com.janilla.web.HandlerFactory;
import com.janilla.web.MethodArgumentsResolver;
import com.janilla.web.MethodHandlerFactory;
import com.janilla.web.NotFoundException;
import com.janilla.web.Render;
import com.janilla.web.ResourceHandlerFactory;
import com.janilla.web.TemplateHandlerFactory;
import com.janilla.web.ToEndpointInvocation;
import com.janilla.web.ToResourceStream;
import com.janilla.web.ToTemplateReader;

public class ConduitFrontend {

	public static void main(String[] args) throws IOException {
		var c = new Properties();
		try (var s = ConduitFrontend.class.getResourceAsStream("configuration.properties")) {
			c.load(s);
		}

		var f = new ConduitFrontend();
		f.setConfiguration(c);
		f.serve();
	}

	Properties configuration;

	Supplier<HttpServer> httpServer = Lazy.of(() -> {
		var s = new HttpServer();
		s.setExecutor(Runnable::run);
		s.setPort(Integer.parseInt(configuration.getProperty("conduit.frontend.http.port")));
		return s;
	});

	Supplier<HandlerFactory> handlerFactory = Lazy.of(() -> {
		var l = Thread.currentThread().getContextClassLoader();
		var x = Stream.<Path>builder();
		var y = Stream.<Class<?>>builder();
		IO.packageFiles("com.janilla.frontend", l, f -> {
			x.add(f);
			var z = Util.getClass(f);
			if (z != null)
				y.add(z);
		});
		IO.packageFiles(ConduitFrontend.class.getPackageName(), l, f -> {
			x.add(f);
			var z = Util.getClass(f);
			if (z != null)
				y.add(z);
		});
		var p = x.build().toArray(Path[]::new);
		var c = y.build().toArray(Class[]::new);

		var i = new ToEndpointInvocation() {

			@Override
			protected Object getInstance(Class<?> c) {
				if (c == ConduitFrontend.class)
					return ConduitFrontend.this;
				return super.getInstance(c);
			}
		};
		i.setClasses(c);
		var f1 = new MethodHandlerFactory();
		f1.setToInvocation(i);
		f1.setArgumentsResolver(new MethodArgumentsResolver());
		var f2 = new TemplateHandlerFactory();
		{
			var s = new ToTemplateReader.Simple();
			s.setClass1(ConduitFrontend.class);
			s.setClasses(c);
			f2.setToReader(s);
		}
		var f3 = new ResourceHandlerFactory();
		{
			var s = new ToResourceStream.Simple();
			s.setPaths(p);
			f3.setToInputStream(s);
		}
		var f = new DelegatingHandlerFactory();
		{
			var a = new HandlerFactory[] { f1, f2, f3 };
			f.setToHandler(o -> {
				if (a != null)
					for (var g : a) {
						var h = g.createHandler(o);
						if (h != null)
							return h;
					}
				return null;
			});
		}
		f1.setRenderFactory(f);
		f2.setIncludeFactory(f);
		return f;
	});

	public Properties getConfiguration() {
		return configuration;
	}

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	public HttpServer getHttpServer() {
		return httpServer.get();
	}

	public HandlerFactory getHandlerFactory() {
		return handlerFactory.get();
	}

	@Handler(value = "/", method = "GET")
	public Document getDocument() {
		return new Document();
	}

	@Handler(value = "/main.js", method = "GET")
	public Script getScript() {
		var u = configuration.getProperty("conduit.frontend.backendUrl");
		return new Script(u);
	}

	public void serve() throws IOException {
		httpServer.get().serve(c -> {
			var o = c.getException() != null ? c.getException() : c.getRequest();
			var h = handlerFactory.get().createHandler(o);
			if (h == null)
				throw new NotFoundException();
			h.handle(c);
		});
	}

	@Render("document.html")
	public record Document() {

		public Head head() {
			return new Head();
		}
	}

	@Render("head.html")
	public record Head() {
	}

	@Render("script.js")
	public record Script(String backendUrl) {
	}
}
