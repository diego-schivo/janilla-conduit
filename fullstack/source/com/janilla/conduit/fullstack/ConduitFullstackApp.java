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

import java.net.InetSocketAddress;
import java.net.URI;
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.conduit.backend.ConduitBackendApp;
import com.janilla.conduit.frontend.ConduitFrontendApp;
import com.janilla.http.HttpExchange;
import com.janilla.http.HttpRequest;
import com.janilla.net.Server;
import com.janilla.reflect.Factory;
import com.janilla.util.Lazy;
import com.janilla.util.Util;

public class ConduitFullstackApp {

	public static void main(String[] args) throws Exception {
		var a = new ConduitFullstackApp();
		{
			var c = new Properties();
			try (var s = a.getClass().getResourceAsStream("configuration.properties")) {
				c.load(s);
			}
			a.configuration = c;
		}
		a.getBackend().getPersistence();

		var s = a.getFactory().create(Server.class);
		s.setAddress(
				new InetSocketAddress(Integer.parseInt(a.configuration.getProperty("conduit.fullstack.server.port"))));
		s.setHandler(a.getHandler());
		s.serve();
	}

	public Properties configuration;

	private Supplier<Factory> factory = Lazy.of(() -> {
		var f = new Factory();
		f.setTypes(Util.getPackageClasses(getClass().getPackageName()).toList());
		f.setSource(this);
		return f;
	});

	Supplier<ConduitBackendApp> backend = Lazy.of(() -> {
		var a = new ConduitBackendApp();
		a.configuration = configuration;
		return a;
	});

	Supplier<ConduitFrontendApp> frontend = Lazy.of(() -> {
		var a = new ConduitFrontendApp();
		a.configuration = configuration;
		return a;
	});

	Supplier<Server.Handler> handler = Lazy.of(() -> {
		return c -> {
			// TODO
//			var o = c.getException() != null ? c.getException() : c.getRequest();
			var o = (Object) ((HttpExchange) c).getRequest();
			var h = switch (o) {
			case HttpRequest q -> {
				URI u;
				try {
					u = q.getUri();
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
			return h.handle(c);
		};
	});

	public ConduitFullstackApp getApplication() {
		return this;
	}

	public Factory getFactory() {
		return factory.get();
	}

	public ConduitBackendApp getBackend() {
		return backend.get();
	}

	public ConduitFrontendApp getFrontend() {
		return frontend.get();
	}

	public Server.Handler getHandler() {
		return handler.get();
	}
}
