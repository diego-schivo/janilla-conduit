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

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Collections;
import java.util.HexFormat;
import java.util.Map;
import java.util.Properties;
import java.util.Random;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import com.janilla.json.Jwt;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Reflection;
import com.janilla.web.Handle;

public class UserApi {

	public Persistence persistence;

	public Properties configuration;

	@Handle(method = "GET", path = "/api/user")
	public Object getCurrent(User user) {
		var h = Map.of("alg", "HS256", "typ", "JWT");
		var p = user != null && user.email() != null ? Map.of("loggedInAs", user.email()) : null;
		var t = p != null ? Jwt.generateToken(h, p, configuration.getProperty("conduit.jwt.key")) : null;
		return Collections.singletonMap("user",
				user != null ? new CurrentUser(user.email(), t, user.username(), user.bio(), user.image()) : null);
	}

	@Handle(method = "POST", path = "/api/users/login")
	public Object authenticate(Authenticate authenticate) throws IOException {
		var v = new Validation();
		v.configuration = configuration;
		v.isNotBlank("email", authenticate.user.email);
		v.isNotBlank("password", authenticate.user.password);
		v.orThrow();
		var c = persistence.crud(User.class);
		var i = c.find("email", authenticate.user.email);
		var u = i >= 0 ? c.read(i) : null;
		{
			var f = HexFormat.of();
			var p = authenticate.user.password.toCharArray();
			var s = u != null ? f.parseHex(u.salt()) : null;
			var h = s != null ? f.formatHex(hash(p, s)) : null;
			v.isValid("email or password", u != null && h.equals(u.hash()));
			v.orThrow();
		}
		return getCurrent(u);
	}

	@Handle(method = "POST", path = "/api/users")
	public Object register(Register register) throws IOException {
		var u = register.user;
		var v = new Validation();
		v.configuration = configuration;
		if (v.isNotBlank("username", u.username) && v.isSafe("username", u.username)) {
			var c = persistence.crud(User.class);
			var i = c.find("username", u.username);
			var w = i >= 0 ? c.read(i) : null;
			v.hasNotBeenTaken("username", w);
		}
		if (v.isNotBlank("email", u.email) && v.isSafe("email", u.email)) {
			var c = persistence.crud(User.class);
			var i = c.find("email", u.email);
			var w = i >= 0 ? c.read(i) : null;
			v.hasNotBeenTaken("email", w);
		}
		if (v.isNotBlank("password", u.password))
			v.isSafe("password", u.password);
		v.orThrow();

		if (Boolean.parseBoolean(configuration.getProperty("conduit.live-demo"))) {
			var c = persistence.crud(User.class).count();
			if (c >= 1000)
				throw new ValidationException("existing users", "are too many (" + c + ")");
		}

		var w = new User(null, null, null, null, null, null, null);
		w = Reflection.copy(u, w);
		w = setHashAndSalt(w, u.password);
		if (w.image() == null || w.image().isBlank())
			w = new User(w.id(), w.email(), w.hash(), w.salt(), w.username(), w.bio(),
					"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><text x='2' y='12.5' font-size='12'>"
							+ new String(Character.toChars(0x1F600)) + "</text></svg>");
		w = persistence.crud(User.class).create(w);
		return getCurrent(w);
	}

	@Handle(method = "PUT", path = "/api/user")
	public Object update(Update update, User user) throws IOException {
//		System.out.println("update=" + update);
		var u = update.user;
		var v = new Validation();
		v.configuration = configuration;
		var c = persistence.crud(User.class);
//		if (v.isNotBlank("username", u.username) && v.isSafe("username", u.username)
		if (u.username != null && !u.username.isBlank() && v.isSafe("username", u.username)
				&& !u.username.equals(user.username())) {
			var i = c.find("username", u.username);
			var w = i >= 0 ? c.read(i) : null;
			v.hasNotBeenTaken("username", w);
		}
		if (v.isNotBlank("email", u.email) && v.isSafe("email", u.email) && !u.email.equals(user.email())) {
			var i = c.find("email", u.email);
			var w = i >= 0 ? c.read(i) : null;
			v.hasNotBeenTaken("email", w);
		}
		v.isEmoji("image", u.image);
		v.isSafe("bio", u.bio);
		v.isSafe("password", u.password);
		v.orThrow();
		var w = c.update(user.id(), x -> {
			x = Reflection.copy(u, x);
			if (u.password != null && !u.password.isBlank())
				x = setHashAndSalt(x, u.password);
			return x;
		});
		return getCurrent(w);
	}

	static Random random = new SecureRandom();

	static User setHashAndSalt(User user, String password) {
		var p = password.toCharArray();
		var s = new byte[16];
		random.nextBytes(s);
		var h = hash(p, s);
		var f = HexFormat.of();
		return new User(user.id(), user.email(), f.formatHex(h), f.formatHex(s), user.username(), user.bio(),
				user.image());
	}

	static byte[] hash(char[] password, byte[] salt) {
		var s = new PBEKeySpec(password, salt, 10000, 512);
		try {
			var f = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
			return f.generateSecret(s).getEncoded();
		} catch (GeneralSecurityException e) {
			throw new RuntimeException(e);
		}
	}

	public record CurrentUser(String email, String token, String username, String bio, String image) {
	}

	public record Authenticate(User user) {

		public record User(String email, String password) {
		}
	}

	public record Register(User user) {

		public record User(String username, String email, String password) {
		}
	}

	public record Update(User user) {

		public record User(String image, String username, String bio, String email, String password) {
		}
	}
}
