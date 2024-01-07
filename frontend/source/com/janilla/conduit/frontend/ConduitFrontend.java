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
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.util.Lazy;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.Handle;
import com.janilla.web.Render;

public class ConduitFrontend {

	public static void main(String[] args) throws IOException {
		var c = new Properties();
		try (var s = ConduitFrontend.class.getResourceAsStream("configuration.properties")) {
			c.load(s);
		}

		var f = new ConduitFrontend();
		f.setConfiguration(c);
//		f.serve();

		var s = new HttpServer();
		s.setExecutor(Runnable::run);
		s.setPort(Integer.parseInt(c.getProperty("conduit.frontend.http.port")));
		s.serve(f.getHandler());
	}

	Properties configuration;

//	Supplier<HttpServer> httpServer = Lazy.of(() -> {
//		var s = new HttpServer();
//		s.setExecutor(Runnable::run);
//		s.setPort(Integer.parseInt(configuration.getProperty("conduit.frontend.http.port")));
//		return s;
//	});

//	Supplier<HandlerFactory> handlerFactory = Lazy.of(() -> {
//		var i = new AnnotationDrivenToInvocation() {
//
//			@Override
//			protected Object getInstance(Class<?> c) {
//				if (c == ConduitFrontend.class)
//					return ConduitFrontend.this;
//				return super.getInstance(c);
//			}
//		};
//		i.setTypes(() -> Util.getPackageClasses("com.janilla.conduit.frontend"));
//		var f1 = new MethodHandlerFactory();
//		f1.setToInvocation(i);
//		f1.setArgumentsResolver(new MethodArgumentsResolver());
//		var f2 = new TemplateHandlerFactory();
//		{
//			var s = new ToTemplateReader.Simple();
//			s.setResourceClass(ConduitFrontend.class);
//			s.setTypes(() -> Util.getPackageClasses("com.janilla.conduit.frontend"));
//			f2.setToReader(s);
//		}
//		var f3 = new ResourceHandlerFactory();
//		{
//			var s = new ToResourceStream.Simple();
//			s.setPaths(() -> Stream.concat(IO.getPackageFiles("com.janilla.frontend"),
//					IO.getPackageFiles("com.janilla.conduit.frontend")));
//			f3.setToInputStream(s);
//		}
//		var f = new DelegatingHandlerFactory();
//		{
//			var a = new HandlerFactory[] { f1, f2, f3 };
//			f.setToHandler(o -> {
//				if (a != null)
//					for (var g : a) {
//						var h = g.createHandler(o);
//						if (h != null)
//							return h;
//					}
//				return null;
//			});
//		}
//		f1.setRenderFactory(f);
//		f2.setIncludeFactory(f);
//		return f;
//	});
	Supplier<HttpHandler> handler = Lazy.of(() -> {
		var b = new ApplicationHandlerBuilder();
		b.setApplication(ConduitFrontend.this);
		return b.build();
	});

	public Properties getConfiguration() {
		return configuration;
	}

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

//	public HttpServer getHttpServer() {
//		return httpServer.get();
//	}

//	public HandlerFactory getHandlerFactory() {
//		return handlerFactory.get();
//	}

	public HttpHandler getHandler() {
		return handler.get();
	}

	@Handle(method = "GET", uri = "/")
	public Document getDocument() {
		return new Document();
	}

	@Handle(method = "GET", uri = "/main.js")
	public Script getScript() {
		var u = configuration.getProperty("conduit.frontend.backendUrl");
		return new Script(u);
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

	@Render(template = "document.html")
	public record Document() {

		public Head head() {
			return new Head();
		}
	}

	@Render(template = "head.html")
	public record Head() {
	}

	@Render(template = "script.js")
	public record Script(String backendUrl) {
	}
}
