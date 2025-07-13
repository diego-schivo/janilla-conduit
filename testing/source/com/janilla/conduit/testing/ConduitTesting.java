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
package com.janilla.conduit.testing;

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;

import javax.net.ssl.SSLContext;

import com.janilla.conduit.fullstack.ConduitFullstack;
import com.janilla.http.HttpExchange;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpServer;
import com.janilla.json.DollarTypeResolver;
import com.janilla.json.TypeResolver;
import com.janilla.net.Net;
import com.janilla.reflect.Factory;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerFactory;
import com.janilla.web.Handle;
import com.janilla.web.NotFoundException;
import com.janilla.web.Render;

@Render(template = "index.html")
public class ConduitTesting {

	public static void main(String[] args) {
		try {
			var pp = new Properties();
			try (var s1 = ConduitTesting.class.getResourceAsStream("configuration.properties")) {
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
			var ct = new ConduitTesting(pp);
			HttpServer s;
			{
				SSLContext sc;
				try (var is = Net.class.getResourceAsStream("testkeys")) {
					sc = Net.getSSLContext("JKS", is, "passphrase".toCharArray());
				}
				s = ct.factory.create(HttpServer.class, Map.of("sslContext", sc, "handler", ct.handler));
			}
			var p = Integer.parseInt(ct.configuration.getProperty("conduit.testing.server.port"));
			s.serve(new InetSocketAddress(p));
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	public Properties configuration;

	public Factory factory;

	public ConduitFullstack fullstack;

	public HttpHandler handler;

	public TypeResolver typeResolver;

	public List<Class<?>> types;

	public ConduitTesting(Properties configuration) {
		this.configuration = configuration;

		types = Util.getPackageClasses(getClass().getPackageName()).toList();
		factory = new Factory(types, this);
		typeResolver = factory.create(DollarTypeResolver.class);

		fullstack = new ConduitFullstack(configuration);

		{
			var f = factory.create(ApplicationHandlerFactory.class);
			handler = x -> {
				var hx = (HttpExchange) x;
//				System.out.println(
//						"ConduitTesting, " + hx.request().getPath() + ", Test.ongoing=" + Test.ongoing.get());
				var h2 = Test.ongoing.get() && !hx.request().getPath().startsWith("/test/") ? fullstack.handler
						: (HttpHandler) y -> {
							var h = f.createHandler(Objects.requireNonNullElse(y.exception(), y.request()));
							if (h == null)
								throw new NotFoundException(y.request().getMethod() + " " + y.request().getTarget());
							return h.handle(y);
						};
				return h2.handle(hx);
			};
		}
	}

	@Handle(method = "GET", path = "/")
	public ConduitTesting application() {
		return this;
	}
}
