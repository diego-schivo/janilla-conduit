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

import java.net.InetSocketAddress;
import java.nio.file.Path;
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.net.Server;
import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Factory;
import com.janilla.util.Lazy;
import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.MethodHandlerFactory;

public class ConduitBackendApp {

	public static void main(String[] args) throws Exception {
		var a = new ConduitBackendApp();
		{
			var c = new Properties();
			try (var s = a.getClass().getResourceAsStream("configuration.properties")) {
				c.load(s);
			}
			a.configuration = c;
		}
		a.getPersistence();

		var s = a.getFactory().create(Server.class);
		s.setAddress(
				new InetSocketAddress(Integer.parseInt(a.configuration.getProperty("conduit.backend.server.port"))));
		s.setHandler(a.getHandler());
		s.serve();
	}

	public Properties configuration;

	public MethodHandlerFactory methodHandlerFactory;

	private Supplier<Factory> factory = Lazy.of(() -> {
		var f = new Factory();
		f.setTypes(Util.getPackageClasses(getClass().getPackageName()).toList());
		f.setSource(this);
		return f;
	});

	private Supplier<Persistence> persistence = Lazy.of(() -> {
		var b = getFactory().create(ApplicationPersistenceBuilder.class);
		{
			var p = configuration.getProperty("conduit.database.file");
			if (p.startsWith("~"))
				p = System.getProperty("user.home") + p.substring(1);
			b.setFile(Path.of(p));
		}
		return b.build();
	});

	private Supplier<Server.Handler> handler = Lazy.of(() -> {
		var b = getFactory().create(ApplicationHandlerBuilder.class);
		return b.build();
	});

	public ConduitBackendApp getApplication() {
		return this;
	}

	public Factory getFactory() {
		return factory.get();
	}

	public Persistence getPersistence() {
		return persistence.get();
	}

	public Server.Handler getHandler() {
		return handler.get();
	}
}
