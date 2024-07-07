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

import java.util.Properties;
import java.util.function.Supplier;

import com.janilla.http.HttpExchange;
import com.janilla.media.HeaderField;
import com.janilla.json.Jwt;
import com.janilla.persistence.Persistence;
import com.janilla.util.Lazy;

public class CustomExchange extends HttpExchange {

	public Properties configuration;

	public Persistence persistence;

	private Supplier<User> user = Lazy.of(() -> {
		var a = getRequest().getHeaders().stream().filter(x -> x.name().equals("Authorization")).map(HeaderField::value)
				.findFirst().orElse(null);
		var t = a != null && a.startsWith("Token ") ? a.substring("Token ".length()) : null;
		var p = t != null ? Jwt.verifyToken(t, configuration.getProperty("conduit.jwt.key")) : null;
		var e = p != null ? (String) p.get("loggedInAs") : null;
		var c = persistence.crud(User.class);
		var i = e != null ? c.find("email", e) : -1;
		var u = i >= 0 ? c.read(i) : null;
		return u;
	});

	public User getUser() {
		return user.get();
	}
}
