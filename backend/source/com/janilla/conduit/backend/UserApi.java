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
import com.janilla.reflect.Parameter;
import com.janilla.reflect.Reflection;
import com.janilla.web.Handler;

public class UserApi {

	Persistence persistence;

	Properties configuration;

	public Persistence getPersistence() {
		return persistence;
	}

	public void setPersistence(Persistence persistence) {
		this.persistence = persistence;
	}

	public Properties getConfiguration() {
		return configuration;
	}

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	@Handler(value = "/api/users/login", method = "POST")
	public Object authenticate(Authenticate authenticate) throws IOException {
		var v = new Validation();
		v.isNotBlank("email", authenticate.user.email);
		v.isNotBlank("password", authenticate.user.password);
		v.orThrow();
		var c = persistence.getCrud(User.class);
		var u = c.indexApply("email", authenticate.user.email, c::read).findFirst().orElse(null);
		{
			var f = HexFormat.of();
			var p = authenticate.user.password.toCharArray();
			var s = u != null ? f.parseHex(u.getSalt()) : null;
			var h = s != null ? f.formatHex(hash(p, s)) : null;
			v.isValid("email or password", u != null && h.equals(u.getHash()));
			v.orThrow();
		}
		return get(u);
	}

	@Handler(value = "/api/user", method = "GET")
	public Object get(User user) {
		var h = Map.of("alg", "HS256", "typ", "JWT");
		var p = user != null ? Map.of("loggedInAs", user.getEmail()) : null;
		var t = p != null ? Jwt.generateToken(h, p, configuration.getProperty("conduit.backend.jwt.key")) : null;
		return Collections.singletonMap("user",
				user != null ? new CurrentUser(user.getEmail(), t, user.getUsername(), user.getBio(), user.getImage())
						: null);
	}

	@Handler(value = "/api/users", method = "POST")
	public Object register(Register register) throws IOException {
		var u = register.user;
		var v = new Validation();
		var c = persistence.getCrud(User.class);
		if (v.isNotBlank("username", u.username) && v.isSafe("username", u.username))
			v.hasNotBeenTaken("username", c.indexApply("username", u.username, c::read).findFirst().orElse(null));
		if (v.isNotBlank("email", u.email) && v.isSafe("email", u.email))
			v.hasNotBeenTaken("email", c.indexApply("email", u.email, c::read).findFirst().orElse(null));
		if (v.isNotBlank("password", u.password))
			v.isSafe("password", u.password);
		v.orThrow();
		var w = new User();
		Reflection.copy(u, w);
		setHashAndSalt(w, u.password);
		if (w.getImage() == null || w.getImage().isBlank())
			w.setImage("https://api.realworld.io/images/smiley-cyrus.jpeg");
		persistence.getCrud(User.class).create(w);
		return get(w);
	}

	@Handler(value = "/api/user", method = "PUT")
	public Object update(Update update, User user) throws IOException {
		var u = update.user;
		var v = new Validation();
		var c = persistence.getCrud(User.class);
		if (v.isNotBlank("username", u.username) && v.isSafe("username", u.username)
				&& !u.username.equals(user.getUsername()))
			v.hasNotBeenTaken("username", c.indexApply("username", u.username, c::read).findFirst().orElse(null));
		if (v.isNotBlank("email", u.email) && v.isSafe("email", u.email) && !u.email.equals(user.getEmail()))
			v.hasNotBeenTaken("email", c.indexApply("email", u.email, c::read).findFirst().orElse(null));
		v.isEmoji("image", u.image);
		v.isSafe("bio", u.bio);
		v.isSafe("password", u.password);
		v.orThrow();
		var w = c.update(user.getId(), x -> {
			Reflection.copy(u, x, n -> !n.equals("id"));
			if (u.password != null && !u.password.isBlank())
				setHashAndSalt(x, u.password);
		});
		return get(w);
	}

	static Random random = new SecureRandom();

	static void setHashAndSalt(User user, String password) {
		var p = password.toCharArray();
		var s = new byte[16];
		random.nextBytes(s);
		var h = hash(p, s);
		var f = HexFormat.of();
		user.setHash(f.formatHex(h));
		user.setSalt(f.formatHex(s));
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

	public record Authenticate(@Parameter("user") User user) {

		public record User(@Parameter("email") String email, @Parameter("password") String password) {
		}
	}

	public record Register(@Parameter("user") User user) {

		public record User(@Parameter("username") String username, @Parameter("email") String email,
				@Parameter("password") String password) {
		}
	}

	public record CurrentUser(String email, String token, String username, String bio, String image) {
	}

	public record Update(@Parameter("user") User user) {

		public record User(@Parameter("image") String image, @Parameter("username") String username,
				@Parameter("bio") String bio, @Parameter("email") String email,
				@Parameter("password") String password) {
		}
	}
}
