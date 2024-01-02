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
import com.janilla.web.Handler;

public class ProfileApi {

	Persistence persistence;

	public Persistence getPersistence() {
		return persistence;
	}

	public void setPersistence(Persistence persistence) {
		this.persistence = persistence;
	}

	@Handler(value = "/api/profiles/([^/]*)", method = "GET")
	public Object get(String username) throws IOException {
		var c = persistence.getCrud(User.class);
		var p = c.indexApply("username", username, c::read).findFirst().orElse(null);
		return Collections.singletonMap("profile", p);
	}

	@Handler(value = "/api/profiles/([^/]*)/follow", method = "POST")
	public Object follow(String username, User user) throws IOException {
		var c = persistence.getCrud(User.class);
		var p = c.indexApply("username", username, c::read).findFirst().orElse(null);
		if (!persistence.getDatabase().indexApply("User.followList", i -> i.add(user.getId(), p.getId())))
			throw new RuntimeException();
		return Map.of("profile", p.getId());
	}

	@Handler(value = "/api/profiles/([^/]*)/follow", method = "DELETE")
	public Object unfollow(String username, User user) throws IOException {
		var c = persistence.getCrud(User.class);
		var p = c.indexApply("username", username, c::read).findFirst().orElse(null);
		if (!persistence.getDatabase().indexApply("User.followList", i -> i.remove(user.getId(), p.getId())))
			throw new RuntimeException();
		return Map.of("profile", p.getId());
	}
}
