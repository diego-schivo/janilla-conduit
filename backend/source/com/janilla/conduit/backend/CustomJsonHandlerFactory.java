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

import java.util.AbstractMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.function.Supplier;

import com.janilla.http.HttpExchange;
import com.janilla.json.JsonToken;
import com.janilla.json.ReflectionJsonIterator;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Reflection;
import com.janilla.web.JsonHandlerFactory;

public class CustomJsonHandlerFactory extends JsonHandlerFactory {

	public Properties configuration;

	public Persistence persistence;

//	@Override
//	protected void render(Object object, HttpExchange exchange) {
//		super.render(object, exchange);
//	}

	@Override
	protected Iterator<JsonToken<?>> buildJsonIterator(Object object, HttpExchange exchange) {
		return new CustomReflectionJsonIterator(object, false, () -> ((CustomHttpExchange) exchange).getUser());
	}

	protected class CustomReflectionJsonIterator extends ReflectionJsonIterator {

		protected final Supplier<User> user;

		public CustomReflectionJsonIterator(Object object, boolean includeType, Supplier<User> user) {
			super(object, includeType);
			this.user = user;
		}

		@Override
		public Iterator<JsonToken<?>> newValueIterator(Object object) {
			var o = stack().peek();
			if (o instanceof Map.Entry x) {
				var n = (String) x.getKey();
				switch (n) {
				case "article":
					if (object instanceof Long y)
						object = persistence.crud(Article.class).read(y);
					break;
				case "author", "profile":
					if (object instanceof Long y)
						object = persistence.crud(User.class).read(y);
					break;
				}
			}
			if (object != null)
				switch (object) {
				case Article a: {
					var m = Reflection.properties(Article.class).filter(x -> !x.name().equals("id")).map(x -> {
//						System.out.println("k=" + k);
						var v = x.get(a);
						return new AbstractMap.SimpleImmutableEntry<>(x.name(), v);
					}).collect(LinkedHashMap::new, (x, y) -> x.put(y.getKey(), y.getValue()), Map::putAll);
					var u = user.get();
					m.put("favorited", u != null && a.id() != null && persistence.crud(Article.class)
							.filter("favoriteList", u.id()).stream().anyMatch(x -> x.equals(a.id())));
					m.put("favoritesCount",
							a.id() != null ? persistence.crud(User.class).count("favoriteList", a.id()) : 0);
					object = m;
				}
					break;
				case User u: {
					var m = Reflection.properties(User.class)
							.filter(x -> !Set.of("hash", "id", "salt").contains(x.name())).map(x -> {
								var v = x.get(u);
								return new AbstractMap.SimpleImmutableEntry<>(x.name(), v);
							}).collect(LinkedHashMap::new, (x, y) -> x.put(y.getKey(), y.getValue()), Map::putAll);
					var v = user.get();
					m.put("following", v != null && persistence.crud(User.class).filter("followList", v.id()).stream()
							.anyMatch(x -> x.equals(u.id())));
					object = m;
				}
					break;
				default:
					break;
				}
			return super.newValueIterator(object);
		}
	}
}
