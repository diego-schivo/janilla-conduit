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
package com.janilla.conduit.testing;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Properties;

import com.janilla.conduit.fullstack.ConduitFullstackApp;
import com.janilla.web.Handle;

public class Test {

	static ConduitFullstackApp fullstack;

	Properties configuration;

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	@Handle(method = "POST", path = "/test/start")
	public void start() throws IOException {
		if (fullstack != null)
			throw new RuntimeException();
		fullstack = new ConduitFullstackApp();
		fullstack.setConfiguration(configuration);
		{
			var p = configuration.getProperty("conduit.backend.database.path");
			if (p.startsWith("~"))
				p = System.getProperty("user.home") + p.substring(1);
			var f = Path.of(p);
			try (var s = getClass().getResourceAsStream("conduit.database")) {
				Files.copy(s, f, StandardCopyOption.REPLACE_EXISTING);
			}
		}
	}

	@Handle(method = "POST", path = "/test/stop")
	public void stop() {
		if (fullstack == null)
			throw new RuntimeException();
		fullstack = null;
	}
}
