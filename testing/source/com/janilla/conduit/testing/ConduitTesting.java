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

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import com.janilla.conduit.fullstack.ConduitFullstack;
import com.janilla.http.HttpExchange;
import com.janilla.http.HttpHandler;
import com.janilla.http.HttpProtocol;
import com.janilla.net.Net;
import com.janilla.net.Server;
import com.janilla.reflect.Factory;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.Handle;
import com.janilla.web.Render;

@Render(template = "index.html")
public class ConduitTesting {

	public static void main(String[] args) throws Exception {
		var pp = new Properties();
		try (var is = ConduitTesting.class.getResourceAsStream("configuration.properties")) {
			pp.load(is);
			if (args.length > 0) {
				var p = args[0];
				if (p.startsWith("~"))
					p = System.getProperty("user.home") + p.substring(1);
				pp.load(Files.newInputStream(Path.of(p)));
			}
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
		var a = new ConduitTesting(pp);

		var hp = a.factory.create(HttpProtocol.class);
		try (var is = Net.class.getResourceAsStream("testkeys")) {
			hp.setSslContext(Net.getSSLContext("JKS", is, "passphrase".toCharArray()));
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
		hp.setHandler(a.handler);

		var s = new Server();
		s.setAddress(
				new InetSocketAddress(Integer.parseInt(a.configuration.getProperty("conduit.testing.server.port"))));
		s.setProtocol(hp);
		s.serve();
	}

	public Properties configuration;

	public Factory factory;

	public ConduitFullstack fullstack;

	public HttpHandler handler;

	public ConduitTesting(Properties configuration) {
		this.configuration = configuration;

		factory = new Factory();
		factory.setTypes(Util.getPackageClasses(getClass().getPackageName()).toList());
		factory.setSource(this);

		fullstack = new ConduitFullstack(configuration);

		{
			var hb = factory.create(ApplicationHandlerBuilder.class);
			var h = hb.build();
			handler = x -> {
				var hx = (HttpExchange) x;
//				System.out.println(
//						"ConduitTesting, " + hx.getRequest().getPath() + ", Test.ongoing=" + Test.ongoing.get());
				var h2 = Test.ongoing.get() && !hx.getRequest().getPath().startsWith("/test/") ? fullstack.handler : h;
				return h2.handle(hx);
			};
		}
	}

	@Handle(method = "GET", path = "/")
	public ConduitTesting application() {
		return this;
	}
}
