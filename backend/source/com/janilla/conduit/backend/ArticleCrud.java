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

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import com.janilla.persistence.Crud;

class ArticleCrud extends Crud<Article> {

	public boolean favorite(Long id, Instant createdAt, Long user) {
		return database.perform((ss, ii) -> {
			var s = ii.perform("User.favoriteList", i -> i.add(id, user));
			ii.perform("Article.favoriteList", i -> i.add(user, (Object) new Object[] { createdAt, id }));
			return s;
		}, true);
	}

	public boolean unfavorite(Long id, Instant createdAt, Long user) {
		return database.perform((ss, ii) -> {
			var s = ii.perform("User.favoriteList", i -> i.remove(id, user));
			ii.perform("Article.favoriteList", i -> i.remove(user, (Object) new Object[] { createdAt, id }));
			return s;
		}, true);
	}

	@Override
	protected void updateIndex(String name, Map<Object, Object> remove, Map<Object, Object> add) {
		database.perform((ss, ii) -> {
			super.updateIndex(name, remove, add);

			if (name != null && name.equals("tagList")) {
				var m = new LinkedHashMap<String, long[]>();
				ii.perform("Article.tagList", i -> {
					if (remove != null)
						for (var t : remove.keySet()) {
							var c = i.count(t);
							m.put((String) t, new long[] { c + 1, c });
						}
					if (add != null)
						for (var t : add.keySet()) {
							var c = i.count(t);
							m.put((String) t, new long[] { c - 1, c });
						}
					return null;
				});
				if (!m.isEmpty())
					ii.perform("Tag.count", i -> {
						for (var e : m.entrySet()) {
							var t = e.getKey();
							var c = e.getValue();
							if (c[0] > 0)
								i.remove(new Object[] { c[0] }, t);
							if (c[1] > 0)
								i.add(new Object[] { c[1] }, t);
						}
						return null;
					});
			}
			return null;
		}, true);
	}
}
