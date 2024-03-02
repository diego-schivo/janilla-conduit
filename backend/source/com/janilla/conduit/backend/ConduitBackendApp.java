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
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.http.HttpExchange;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpServer;
import com.janilla.io.IO;
import com.janilla.json.Jwt;
import com.janilla.persistence.Persistence;
import com.janilla.util.Lazy;
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
			a.setConfiguration(c);
		}
		a.getPersistence();

		var s = a.new Server();
		s.setPort(Integer.parseInt(a.getConfiguration().getProperty("conduit.backend.server.port")));
		s.setHandler(a.getHandler());
		s.run();
	}

	Properties configuration;

	IO.Supplier<Persistence> persistence = IO.Lazy.of(() -> {
		var b = new CustomPersistenceBuilder();
		{
			var p = configuration.getProperty("conduit.database.file");
			if (p.startsWith("~"))
				p = System.getProperty("user.home") + p.substring(1);
			b.setFile(Path.of(p));
		}
		b.setApplication(this);
		return b.build();
	});

	AnnotationDrivenToMethodInvocation toInvocation;

	Supplier<IO.Consumer<HttpExchange>> handler = Lazy.of(() -> {
		var b = new HandlerBuilder();
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

	public IO.Consumer<HttpExchange> getHandler() {
		return handler.get();
	}

	class Server extends HttpServer {

		@Override
		protected HttpExchange newExchange(HttpRequest request) {
			return new Exchange();
		}
	}

	public class Exchange extends HttpExchange {

		Supplier<User> user = Lazy.of(() -> {
			var a = getRequest().getHeaders().get("Authorization");
			var t = a != null && a.startsWith("Token ") ? a.substring("Token ".length()) : null;
			var p = t != null ? Jwt.verifyToken(t, getConfiguration().getProperty("conduit.jwt.key")) : null;
			var e = p != null ? (String) p.get("loggedInAs") : null;
			try {
				var c = getPersistence().getCrud(User.class);
				var i = e != null ? c.find("email", e) : -1;
				var u = i >= 0 ? c.read(i) : null;
				return u;
			} catch (IOException f) {
				throw new UncheckedIOException(f);
			}
		});

		public User getUser() {
			return user.get();
		}
	}

	class HandlerBuilder extends ApplicationHandlerBuilder {

		{
			application = ConduitBackendApp.this;
		}

		@Override
		protected MethodHandlerFactory buildMethodHandlerFactory() {
			var f = super.buildMethodHandlerFactory();
			f.setArgumentsResolver(new CustomMethodArgumentsResolver());
			toInvocation = (AnnotationDrivenToMethodInvocation) f.getToInvocation();
			return f;
		}
	}
}
