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
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Properties;

import javax.net.ssl.SSLContext;

import com.janilla.conduit.backend.ConduitBackend;
import com.janilla.conduit.frontend.ConduitFrontend;
import com.janilla.http.HttpExchange;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpProtocol;
import com.janilla.http.HttpRequest;
import com.janilla.json.MapAndType;
import com.janilla.net.Net;
import com.janilla.net.Server;
import com.janilla.reflect.Factory;
import com.janilla.util.Util;

public class ConduitFullstack {

	public static void main(String[] args) {
		try {
			var pp = new Properties();
			try (var is = ConduitFullstack.class.getResourceAsStream("configuration.properties")) {
				pp.load(is);
				if (args.length > 0) {
					var p = args[0];
					if (p.startsWith("~"))
						p = System.getProperty("user.home") + p.substring(1);
					pp.load(Files.newInputStream(Path.of(p)));
				}
			}
			var cf = new ConduitFullstack(pp);
			Server s;
			{
				var a = new InetSocketAddress(
						Integer.parseInt(cf.configuration.getProperty("conduit.fullstack.server.port")));
				SSLContext sc;
				try (var is = Net.class.getResourceAsStream("testkeys")) {
					sc = Net.getSSLContext("JKS", is, "passphrase".toCharArray());
				}
				var p = cf.factory.create(HttpProtocol.class,
						Map.of("handler", cf.handler, "sslContext", sc, "useClientMode", false));
				s = new Server(a, p);
			}
			s.serve();
		} catch (Throwable e) {
			e.printStackTrace();
		}
	}

	public Properties configuration;

	public Factory factory;

	public HttpHandler handler;

	public ConduitBackend backend;

	public ConduitFrontend frontend;

	public MapAndType.TypeResolver typeResolver;

	public Iterable<Class<?>> types;

	public ConduitFullstack(Properties configuration) {
		this.configuration = configuration;

		types = Util.getPackageClasses(getClass().getPackageName()).toList();
		factory = new Factory(types, this);
		typeResolver = factory.create(MapAndType.DollarTypeResolver.class);

		handler = x -> {
			var hx = (HttpExchange) x;
//			System.out.println("ConduitFullstack, " + hx.getRequest().getPath());
			var o = hx.getException() != null ? hx.getException() : hx.getRequest();
			var h = switch (o) {
			case HttpRequest rq -> rq.getPath().startsWith("/api/") ? backend.handler : frontend.handler;
			case Exception _ -> backend.handler;
			default -> null;
			};
			return h.handle(hx);
		};

		backend = new ConduitBackend(configuration);
		frontend = new ConduitFrontend(configuration);
	}

	public ConduitFullstack application() {
		return this;
	}
}
