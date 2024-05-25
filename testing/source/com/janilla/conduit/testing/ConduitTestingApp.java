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
package com.janilla.conduit.testing;

import java.net.URI;
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.http.HttpServer;
import com.janilla.reflect.Factory;
import com.janilla.util.Lazy;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.Handle;
import com.janilla.web.Render;
import com.janilla.web.WebHandler;

public class ConduitTestingApp {

	public static void main(String[] args) throws Exception {
		var a = new ConduitTestingApp();
		{
			var c = new Properties();
			try (var s = a.getClass().getResourceAsStream("configuration.properties")) {
				c.load(s);
			}
			a.configuration = c;
		}

		var s = a.getFactory().create(HttpServer.class);
		s.setPort(Integer.parseInt(a.configuration.getProperty("conduit.testing.server.port")));
		s.setHandler(a.getHandler());
		s.run();
	}

	public Properties configuration;

	private Supplier<Factory> factory = Lazy.of(() -> {
		var f = new Factory();
		f.setTypes(Util.getPackageClasses(getClass().getPackageName()).toList());
		f.setSource(this);
		return f;
	});

	Supplier<WebHandler> handler = Lazy.of(() -> {
		var b = getFactory().create(ApplicationHandlerBuilder.class);
		var h1 = b.build();

		return c -> {
			URI u;
			try {
				u = c.getRequest().getURI();
			} catch (NullPointerException e) {
				u = null;
			}
			var h = Test.fullstack != null && !(u != null && u.getPath().startsWith("/test/"))
					? Test.fullstack.getHandler()
					: h1;
			h.handle(c);
		};
	});

	public ConduitTestingApp getApplication() {
		return this;
	}

	public Factory getFactory() {
		return factory.get();
	}

	public WebHandler getHandler() {
		return handler.get();
	}

	@Handle(method = "GET", path = "/")
	public @Render("app.html") Object getApp() {
		return new Object();
	}
}
