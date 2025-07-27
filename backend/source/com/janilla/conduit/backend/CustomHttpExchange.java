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

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import com.janilla.http.HttpExchange;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpResponse;
import com.janilla.json.Jwt;
import com.janilla.persistence.Persistence;

public class CustomHttpExchange extends HttpExchange.Base {

	public Properties configuration;

	public Persistence persistence;

	protected final Map<String, Object> session = new HashMap<>();

	public CustomHttpExchange(HttpRequest request, HttpResponse response) {
		super(request, response);
	}

	public User getUser() {
		if (!session.containsKey("user")) {
			var a = request().getHeaderValue("authorization");
			var t = a != null && a.startsWith("Token ") ? a.substring("Token ".length()) : null;
			var p = t != null ? Jwt.verifyToken(t, configuration.getProperty("conduit.jwt.key")) : null;
			var e = p != null ? (String) p.get("loggedInAs") : null;
			var c = persistence.crud(User.class);
			session.put("user", c.read(c.find("email", e)));
		}
		return (User) session.get("user");
	}

	@Override
	public HttpExchange withException(Exception exception) {
		this.exception = exception;
		return this;
	}
}
