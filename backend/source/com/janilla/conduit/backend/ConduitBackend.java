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

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import javax.net.ssl.SSLContext;

import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.json.MapAndType;
import com.janilla.net.Net;
import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Factory;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.MethodHandlerFactory;
import com.janilla.web.RenderableFactory;

public class ConduitBackend {

	public static void main(String[] args) {
		try {
			var pp = new Properties();
			try (var s1 = ConduitBackend.class.getResourceAsStream("configuration.properties")) {
				pp.load(s1);
				if (args.length > 0) {
					var p = args[0];
					if (p.startsWith("~"))
						p = System.getProperty("user.home") + p.substring(1);
					try (var s2 = Files.newInputStream(Path.of(p))) {
						pp.load(s2);
					}
				}
			}
			var x = new ConduitBackend(pp);

			HttpServer s;
			{
				SSLContext c;
				try (var is = Net.class.getResourceAsStream("testkeys")) {
					c = Net.getSSLContext("JKS", is, "passphrase".toCharArray());
				}
				s = x.factory.create(HttpServer.class, Map.of("sslContext", c, "handler", x.handler));
			}
			var p = Integer.parseInt(x.configuration.getProperty("conduit.backend.server.port"));
			s.serve(new InetSocketAddress(p));
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	public Properties configuration;

	public Factory factory;

	public Persistence persistence;

	public RenderableFactory renderableFactory;

	public HttpHandler handler;

	public MethodHandlerFactory methodHandlerFactory;

	public MapAndType.TypeResolver typeResolver;

	public List<Class<?>> types;

	public ConduitBackend(Properties configuration) {
		this.configuration = configuration;

		types = Util.getPackageClasses(getClass().getPackageName()).toList();
		factory = new Factory(types, this);
		typeResolver = factory.create(MapAndType.DollarTypeResolver.class);

		{
			var f = configuration.getProperty("conduit.database.file");
			if (f.startsWith("~"))
				f = System.getProperty("user.home") + f.substring(1);
			var b = factory.create(ApplicationPersistenceBuilder.class, Map.of("databaseFile", Path.of(f)));
			persistence = b.build();
		}

		renderableFactory = new RenderableFactory();
		handler = factory.create(ApplicationHandlerBuilder.class).build();
	}

	public ConduitBackend application() {
		return this;
	}
}
