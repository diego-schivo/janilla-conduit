/*
 * MIT License
 *
 * Copyright (c) 2024-2025 Diego Schivo
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
import java.nio.file.Path;
import java.util.Collections;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import javax.net.ssl.SSLContext;

import com.janilla.conduit.backend.ConduitBackend;
import com.janilla.conduit.frontend.ConduitFrontend;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpServer;
import com.janilla.ioc.DependencyInjector;
import com.janilla.java.Java;
import com.janilla.net.Net;

public class ConduitFullstack {

	public static final AtomicReference<ConduitFullstack> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			ConduitFullstack a;
			{
				var f = new DependencyInjector(Java.getPackageClasses(ConduitFullstack.class.getPackageName()),
						ConduitFullstack.INSTANCE::get);
				a = f.create(ConduitFullstack.class,
						Java.hashMap("factory", f, "configurationFile",
								args.length > 0 ? Path.of(
										args[0].startsWith("~") ? System.getProperty("user.home") + args[0].substring(1)
												: args[0])
										: null));
			}

			HttpServer s;
			{
				SSLContext c;
				try (var x = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext(Map.entry("JKS", x), "passphrase".toCharArray());
				}
				var p = Integer.parseInt(a.configuration.getProperty("conduit.fullstack.server.port"));
				s = a.injector.create(HttpServer.class,
						Map.of("sslContext", c, "endpoint", new InetSocketAddress(p), "handler", a.handler));
			}
			s.serve();
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	protected final Properties configuration;

	protected final DependencyInjector injector;

	protected final HttpHandler handler;

	protected final ConduitBackend backend;

	protected final ConduitFrontend frontend;

//	protected final TypeResolver typeResolver;

	public ConduitFullstack(DependencyInjector injector, Path configurationFile) {
		this.injector = injector;
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		configuration = injector.create(Properties.class, Collections.singletonMap("file", configurationFile));
//		typeResolver = injector.create(DollarTypeResolver.class);

		backend = injector.create(ConduitBackend.class,
				Java.hashMap("factory", new DependencyInjector(Stream.of("fullstack", "backend", "base").flatMap(x -> Java
						.getPackageClasses(ConduitBackend.class.getPackageName().replace(".backend", "." + x)).stream())
						.toList(), ConduitBackend.INSTANCE::get), "configurationFile", configurationFile));
		frontend = injector.create(ConduitFrontend.class,
				Java.hashMap("factory", new DependencyInjector(Stream.of("fullstack", "frontend")
						.flatMap(x -> Java
								.getPackageClasses(ConduitFrontend.class.getPackageName().replace(".frontend", "." + x))
								.stream())
						.toList(), ConduitFrontend.INSTANCE::get), "configurationFile", configurationFile));

		handler = x -> {
//			IO.println("ConduitFullstack, " + x.request().getPath());
			var o = x.exception() != null ? x.exception() : x.request();
			var h = switch (o) {
			case HttpRequest rq -> rq.getPath().startsWith("/api/") ? backend.handler() : frontend.handler();
			case Exception _ -> backend.handler();
			default -> null;
			};
			return h.handle(x);
		};
	}

	public ConduitFullstack application() {
		return this;
	}

	public ConduitBackend backend() {
		return backend;
	}

	public Properties configuration() {
		return configuration;
	}

	public DependencyInjector injector() {
		return injector;
	}

	public ConduitFrontend frontend() {
		return frontend;
	}

	public HttpHandler handler() {
		return handler;
	}
}
