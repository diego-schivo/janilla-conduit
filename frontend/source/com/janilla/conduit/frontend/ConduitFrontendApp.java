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
import java.util.stream.Stream;

import com.janilla.http.HttpExchange;
import com.janilla.http.HttpServer;
import com.janilla.io.IO;
import com.janilla.reflect.Factory;
import com.janilla.reflect.Reflection;
import com.janilla.util.Lazy;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.Handle;
import com.janilla.web.Render;

public class ConduitFrontendApp {

	public static void main(String[] args) throws IOException {
		var a = new ConduitFrontendApp();
		{
			var c = new Properties();
			try (var s = a.getClass().getResourceAsStream("configuration.properties")) {
				c.load(s);
			}
			a.configuration = c;
		}

		var s = new HttpServer();
		s.setPort(Integer.parseInt(a.configuration.getProperty("conduit.frontend.server.port")));
		s.setHandler(a.getHandler());
		s.run();
	}

	public Properties configuration;

	private Supplier<Factory> factory = Lazy.of(() -> {
		var f = new Factory();
		f.setTypes(Stream.concat(Util.getPackageClasses("com.janilla.store.backend"),
				Util.getPackageClasses(getClass().getPackageName())).toList());
		f.setEnclosing(this);
		return f;
	});

	Supplier<IO.Consumer<HttpExchange>> handler = Lazy.of(() -> {
//		var b = new ApplicationHandlerBuilder();
//		b.setApplication(this);
		var f = getFactory();
		var b = f.newInstance(ApplicationHandlerBuilder.class);
		var p = Reflection.property(b.getClass(), "application");
		if (p != null)
			p.set(b, f.getEnclosing());
		return b.build();
	});

	public Factory getFactory() {
		return factory.get();
	}

	public IO.Consumer<HttpExchange> getHandler() {
		return handler.get();
	}

	@Handle(method = "GET", path = "/")
	public App getApp() {
		var u = configuration.getProperty("conduit.api.url");
		return new App(u);
	}

	@Render("app.html")
	public record App(String apiUrl) {
	}
}
