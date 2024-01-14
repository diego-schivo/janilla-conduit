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
package com.janilla.conduit.frontend;

import java.io.IOException;
import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.http.ExchangeContext;
import com.janilla.http.HttpServer;
import com.janilla.io.IO;
import com.janilla.util.Lazy;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.Handle;
import com.janilla.web.Render;

public class ConduitFrontend {

	public static void main(String[] args) throws IOException {
		var c = new Properties();
		try (var s = ConduitFrontend.class.getResourceAsStream("configuration.properties")) {
			c.load(s);
		}

		var f = new ConduitFrontend();
		f.setConfiguration(c);

		var s = new HttpServer();
		s.setExecutor(Runnable::run);
		s.setPort(Integer.parseInt(c.getProperty("conduit.frontend.http.port")));
		s.setHandler(f.getHandler());
		s.serve();
	}

	Properties configuration;

	Supplier<IO.Consumer<ExchangeContext>> handler = Lazy.of(() -> {
		var b = new ApplicationHandlerBuilder();
		b.setApplication(ConduitFrontend.this);
		return b.build();
	});

	public Properties getConfiguration() {
		return configuration;
	}

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	public IO.Consumer<ExchangeContext> getHandler() {
		return handler.get();
	}

	@Handle(method = "GET", uri = "/")
	public Page getPage() {
		return new Page();
	}

	@Handle(method = "GET", uri = "/script.js")
	public Script getScript() {
		var u = configuration.getProperty("conduit.frontend.backendUrl");
		return new Script(u);
	}

	@Render(template = "head.html")
	public record Head() {
	}

	@Render(template = "page.html")
	public record Page() {

		public Head head() {
			return new Head();
		}
	}

	@Render(template = "script.js")
	public record Script(String backendUrl) {
	}
}
