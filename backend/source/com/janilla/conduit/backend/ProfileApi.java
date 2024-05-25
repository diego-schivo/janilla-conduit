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

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import com.janilla.persistence.Persistence;
import com.janilla.web.Handle;

public class ProfileApi {

	public Persistence persistence;

	@Handle(method = "GET", path = "/api/profiles/([^/]*)")
	public Object read(String username) throws IOException {
		var c = persistence.crud(User.class);
		var i = c.find("username", username);
		var u = i >= 0 ? c.read(i) : null;
		return Collections.singletonMap("profile", u);
	}

	@Handle(method = "POST", path = "/api/profiles/([^/]*)/follow")
	public Object follow(String username, User user) throws IOException {
		var c = (UserCrud) persistence.crud(User.class);
		var i = c.find("username", username);
		var u = i >= 0 ? c.read(i) : null;
		c.follow(u.id(), user.id());
		return Map.of("profile", u.id());
	}

	@Handle(method = "DELETE", path = "/api/profiles/([^/]*)/follow")
	public Object unfollow(String username, User user) throws IOException {
		var c = (UserCrud) persistence.crud(User.class);
		var i = c.find("username", username);
		var u = i >= 0 ? c.read(i) : null;
		c.unfollow(u.id(), user.id());
		return Map.of("profile", u.id());
	}
}
