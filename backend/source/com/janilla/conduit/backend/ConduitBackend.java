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
package com.janilla.conduit.backend;

import java.lang.reflect.Modifier;
import java.net.InetSocketAddress;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import javax.net.ssl.SSLContext;

import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.ioc.DiFactory;
import com.janilla.java.DollarTypeResolver;
import com.janilla.java.Java;
import com.janilla.java.TypeResolver;
import com.janilla.net.Net;
import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.web.ApplicationHandlerFactory;
import com.janilla.web.Invocable;
import com.janilla.web.InvocationHandlerFactory;
import com.janilla.web.NotFoundException;
import com.janilla.web.RenderableFactory;

public class ConduitBackend {

	public static final AtomicReference<ConduitBackend> INSTANCE = new AtomicReference<>();

	public static void main(String[] args) {
		try {
			ConduitBackend a;
			{
				var f = new DiFactory(Stream.of("backend", "base")
						.flatMap(x -> Java
								.getPackageClasses(ConduitBackend.class.getPackageName().replace(".backend", "." + x))
								.stream())
						.toList(), INSTANCE::get);
				a = f.create(ConduitBackend.class,
						Java.hashMap("diFactory", f, "configurationFile",
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
				var p = Integer.parseInt(a.configuration.getProperty("conduit.backend.server.port"));
				s = a.diFactory.create(HttpServer.class,
						Map.of("sslContext", c, "endpoint", new InetSocketAddress(p), "handler", a.handler));
			}
			s.serve();
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	protected final Properties configuration;

	protected final DiFactory diFactory;

	protected final HttpHandler handler;

	protected InvocationHandlerFactory methodHandlerFactory;

	protected final Persistence persistence;

	protected final RenderableFactory renderableFactory;

	protected final TypeResolver typeResolver;

	public ConduitBackend(DiFactory diFactory, Path configurationFile) {
		this.diFactory = diFactory;
		if (!INSTANCE.compareAndSet(null, this))
			throw new IllegalStateException();
		configuration = diFactory.create(Properties.class, Collections.singletonMap("file", configurationFile));
		typeResolver = diFactory.create(DollarTypeResolver.class);

		{
			var f = configuration.getProperty("conduit.database.file");
			if (f.startsWith("~"))
				f = System.getProperty("user.home") + f.substring(1);
			var b = diFactory.create(ApplicationPersistenceBuilder.class, Map.of("databaseFile", Path.of(f)));
			persistence = b.build();
		}

		renderableFactory = new RenderableFactory();

		{
			var f = diFactory.create(ApplicationHandlerFactory.class, Map.of("methods",
					types().stream().flatMap(x -> Arrays.stream(x.getMethods())
							.filter(y -> !Modifier.isStatic(y.getModifiers())).map(y -> new Invocable(x, y)))
							.toList(),
					"files", List.of()));
			handler = x -> {
				var h = f.createHandler(Objects.requireNonNullElse(x.exception(), x.request()));
				if (h == null)
					throw new NotFoundException(x.request().getMethod() + " " + x.request().getTarget());
				return h.handle(x);
			};
		}
	}

	public ConduitBackend application() {
		return this;
	}

	public Properties configuration() {
		return configuration;
	}

	public DiFactory diFactory() {
		return diFactory;
	}

	public HttpHandler handler() {
		return handler;
	}

	public InvocationHandlerFactory methodHandlerFactory() {
		return methodHandlerFactory;
	}

	public Persistence persistence() {
		return persistence;
	}

	public RenderableFactory renderableFactory() {
		return renderableFactory;
	}

	public TypeResolver typeResolver() {
		return typeResolver;
	}

	public Collection<Class<?>> types() {
		return diFactory.types();
	}
}
