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
import java.io.UncheckedIOException;
import java.util.AbstractMap.SimpleEntry;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Supplier;

import com.janilla.json.JsonToken;
import com.janilla.json.ReflectionJsonIterator;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Reflection;

class CustomReflectionJsonIterator extends ReflectionJsonIterator {
	
	Persistence persistence;
	
	Supplier<User> user;

	@Override
	public Iterator<JsonToken<?>> newValueIterator(Object object) {
		var o = getStack().peek();
		if (o instanceof Entry e) {
			var n = (String) e.getKey();
			object = switch (n) {
			case "article" -> {
				if (object instanceof Long i)
					try {
						object = persistence.getCrud(Article.class).read(i);
					} catch (IOException f) {
						throw new UncheckedIOException(f);
					}
				yield object;
			}
			case "author", "profile" -> {
				if (object instanceof Long i)
					try {
						object = persistence.getCrud(User.class).read(i);
					} catch (IOException f) {
						throw new UncheckedIOException(f);
					}
				yield object;
			}
			default -> object;
			};
		}
		if (object != null)
			object = switch (object) {
			case Article a -> {
				var m = Reflection.properties(Article.class).filter(n -> switch (n) {
				case "id" -> false;
				default -> true;
				}).map(k -> {
//					System.out.println("k=" + k);
					var g = Reflection.getter(Article.class, k);
					Object v;
					try {
						v = g.invoke(a);
					} catch (ReflectiveOperationException f) {
						throw new RuntimeException(f);
					}
					return new SimpleEntry<>(k, v);
				}).collect(LinkedHashMap::new, (b, f) -> b.put(f.getKey(), f.getValue()), Map::putAll);
				var u = user.get();
				try {
					if (u != null)
						persistence.getCrud(User.class).performOnIndex("favoriteList", u.getId(), x -> {
							if (x.anyMatch(y -> y == a.getId()))
								m.put("favorited", true);
							return null;
						});
					if (!m.containsKey("favorited"))
						m.put("favorited", false);
					m.put("favoritesCount", persistence.getCrud(Article.class).count("favoriteList", a.getId()));
				} catch (IOException e) {
					throw new UncheckedIOException(e);
				}
				yield m;
			}
			case User u -> {
				var m = Reflection.properties(User.class).filter(n -> switch (n) {
				case "hash", "id", "salt" -> false;
				default -> true;
				}).map(k -> {
					var g = Reflection.getter(User.class, k);
					Object w;
					try {
						w = g.invoke(u);
					} catch (ReflectiveOperationException h) {
						throw new RuntimeException(h);
					}
					return new SimpleEntry<>(k, w);
				}).collect(LinkedHashMap::new, (a, g) -> a.put(g.getKey(), g.getValue()), Map::putAll);
				var v = user.get();
				try {
					if (v != null)
						persistence.getCrud(User.class).performOnIndex("followList", v.getId(), x -> {
							if (x.anyMatch(y -> y == u.getId()))
								m.put("following", true);
							return null;
						});
					if (!m.containsKey("following"))
						m.put("following", false);
				} catch (IOException e) {
					throw new UncheckedIOException(e);
				}
				yield m;
			}
			default -> object;
			};
		return super.newValueIterator(object);
	}
}