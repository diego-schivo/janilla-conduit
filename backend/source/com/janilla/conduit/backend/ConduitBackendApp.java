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
import java.nio.file.Path;
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.http.HttpExchange;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpServer;
import com.janilla.io.IO;
import com.janilla.json.Jwt;
import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Factory;
import com.janilla.reflect.Reflection;
import com.janilla.util.Lazy;
import com.janilla.util.Util;
import com.janilla.web.AnnotationDrivenToMethodInvocation;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.MethodHandlerFactory;

public class ConduitBackendApp {

	public static void main(String[] args) throws IOException {
		var a = new ConduitBackendApp();
		{
			var c = new Properties();
			try (var s = a.getClass().getResourceAsStream("configuration.properties")) {
				c.load(s);
			}
			a.configuration = c;
		}
		a.getPersistence();

		var s = a.new Server();
		s.setPort(Integer.parseInt(a.configuration.getProperty("conduit.backend.server.port")));
		s.setHandler(a.getHandler());
		s.run();
	}

	public Properties configuration;

	public AnnotationDrivenToMethodInvocation toInvocation;

	private Supplier<Factory> factory = Lazy.of(() -> {
		var f = new Factory();
		f.setTypes(
				Util.getPackageClasses(getClass().getPackageName()).toList());
		f.setEnclosing(this);
		return f;
	});

	private Supplier<Persistence> persistence = Lazy.of(() -> {
//		var b = new CustomPersistenceBuilder();
		var f = getFactory();
		var b = f.newInstance(ApplicationPersistenceBuilder.class);
		{
			var p = configuration.getProperty("conduit.database.file");
			if (p.startsWith("~"))
				p = System.getProperty("user.home") + p.substring(1);
			b.setFile(Path.of(p));
		}
//		b.setApplication(this);
		return b.build();
	});

	private Supplier<IO.Consumer<HttpExchange>> handler = Lazy.of(() -> {
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

	public Persistence getPersistence() {
		return persistence.get();
	}

	public IO.Consumer<HttpExchange> getHandler() {
		return handler.get();
	}

	public class Server extends HttpServer {

		@Override
		protected HttpExchange createExchange(HttpRequest request) {
			return new Exchange();
		}
	}

	public class Exchange extends HttpExchange {

		private Supplier<User> user = Lazy.of(() -> {
			var a = getRequest().getHeaders().get("Authorization");
			var t = a != null && a.startsWith("Token ") ? a.substring("Token ".length()) : null;
			var p = t != null ? Jwt.verifyToken(t, configuration.getProperty("conduit.jwt.key")) : null;
			var e = p != null ? (String) p.get("loggedInAs") : null;
			var c = getPersistence().getCrud(User.class);
			var i = e != null ? c.find("email", e) : -1;
			var u = i >= 0 ? c.read(i) : null;
			return u;
		});

		public User getUser() {
			return user.get();
		}
	}

	public class HandlerBuilder extends ApplicationHandlerBuilder {
//		{
//			application = ConduitBackendApp.this;
//		}

		@Override
		protected MethodHandlerFactory buildMethodHandlerFactory() {
			var f = super.buildMethodHandlerFactory();
			f.setArgumentsResolver(new CustomMethodArgumentsResolver());
			toInvocation = (AnnotationDrivenToMethodInvocation) f.getToInvocation();
			return f;
		}
	}
}
