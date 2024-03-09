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
package com.janilla.conduit.fullstack;

import java.io.IOException;
import java.net.URI;
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.conduit.backend.ConduitBackendApp;
import com.janilla.conduit.frontend.ConduitFrontendApp;
import com.janilla.http.HttpExchange;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpServer;
import com.janilla.io.IO;
import com.janilla.util.Lazy;

public class ConduitFullstackApp {

	public static void main(String[] args) throws IOException {
		var a = new ConduitFullstackApp();
		{
			var c = new Properties();
			try (var s = a.getClass().getResourceAsStream("configuration.properties")) {
				c.load(s);
			}
			a.setConfiguration(c);
		}
		a.getBackend().getPersistence();

		var s = a.new Server();
		s.setPort(Integer.parseInt(a.getConfiguration().getProperty("conduit.fullstack.server.port")));
		s.setHandler(a.getHandler());
		s.run();
	}

	Properties configuration;

	Supplier<ConduitBackendApp> backend = Lazy.of(() -> {
		var a = new ConduitBackendApp();
		a.setConfiguration(configuration);
		return a;
	});

	Supplier<ConduitFrontendApp> frontend = Lazy.of(() -> {
		var a = new ConduitFrontendApp();
		a.setConfiguration(configuration);
		return a;
	});

	Supplier<IO.Consumer<HttpExchange>> handler = Lazy.of(() -> {
		return c -> {
			var o = c.getException() != null ? c.getException() : c.getRequest();
			var h = switch (o) {
			case HttpRequest q -> {
				URI u;
				try {
					u = q.getURI();
				} catch (NullPointerException e) {
					u = null;
				}
//				System.out.println("u=" + u);
				yield u != null && u.getPath().startsWith("/api/") ? backend.get().getHandler()
						: frontend.get().getHandler();
			}
			case Exception e -> backend.get().getHandler();
			default -> null;
			};
			h.accept(c);
		};
	});

	public Properties getConfiguration() {
		return configuration;
	}

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	public ConduitBackendApp getBackend() {
		return backend.get();
	}

	public ConduitFrontendApp getFrontend() {
		return frontend.get();
	}

	public IO.Consumer<HttpExchange> getHandler() {
		return handler.get();
	}

	class Server extends HttpServer {

		@Override
		protected HttpExchange newExchange(HttpRequest request) {
			URI u;
			try {
				u = request.getURI();
			} catch (NullPointerException e) {
				u = null;
			}
			return u != null && u.getPath().startsWith("/api/") ? getBackend().new Exchange()
					: super.newExchange(request);
		}
	}
}
