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

import java.util.AbstractMap;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
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

	@Override
	protected void render(Object object, HttpExchange exchange) {
		super.render(object, exchange);
	}

	@Override
	protected Iterator<JsonToken<?>> buildJsonIterator(Object object, HttpExchange exchange) {
		var i = new CustomReflectionJsonIterator();
		i.setObject(object);
		i.user = () -> ((CustomExchange) exchange).getUser();
		return i;
	}

	protected class CustomReflectionJsonIterator extends ReflectionJsonIterator {

		private Supplier<User> user;

		@Override
		public Iterator<JsonToken<?>> buildValueIterator(Object object) {
			var o = getStack().peek();
			if (o instanceof Entry e) {
				var n = (String) e.getKey();
				switch (n) {
				case "article":
					if (object instanceof Long i)
						object = persistence.crud(Article.class).read(i);
					break;
				case "author", "profile":
					if (object instanceof Long i)
						object = persistence.crud(User.class).read(i);
					break;
				}
			}
			if (object != null)
				switch (object) {
				case Article a: {
					var m = Reflection.properties(Article.class).filter(n -> switch (n) {
					case "id" -> false;
					default -> true;
					}).map(k -> {
//						System.out.println("k=" + k);
						var g = Reflection.property(Article.class, k);
						var v = g.get(a);
						return new AbstractMap.SimpleEntry<>(k, v);
					}).collect(LinkedHashMap::new, (b, f) -> b.put(f.getKey(), f.getValue()), Map::putAll);
					var u = user.get();
					m.put("favorited",
							u != null && a.id() != null
									&& Arrays.stream(persistence.crud(Article.class).filter("favoriteList", u.id()))
											.anyMatch(x -> x == a.id()));
					m.put("favoritesCount",
							a.id() != null ? persistence.crud(User.class).count("favoriteList", a.id()) : 0);
					object = m;
				}
					break;
				case User u: {
					var m = Reflection.properties(User.class).filter(n -> switch (n) {
					case "hash", "id", "salt" -> false;
					default -> true;
					}).map(k -> {
						var g = Reflection.property(User.class, k);
						var w = g.get(u);
						return new AbstractMap.SimpleEntry<>(k, w);
					}).collect(LinkedHashMap::new, (a, g) -> a.put(g.getKey(), g.getValue()), Map::putAll);
					var v = user.get();
					m.put("following",
							v != null && Arrays.stream(persistence.crud(User.class).filter("followList", v.id()))
									.anyMatch(x -> x == u.id()));
					object = m;
				}
					break;
				default:
					break;
				}
			return super.buildValueIterator(object);
		}
	}
}
