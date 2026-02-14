/*
 * MIT License
 *
 * Copyright (c) 2024-2026 Diego Schivo
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
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.janilla.backend.persistence.Crud;
import com.janilla.backend.persistence.Persistence;

class ArticleCrud extends Crud<Long, Article> {

	public ArticleCrud(Persistence persistence) {
		super(Article.class, persistence.idConverter(Article.class), persistence);
	}

	public boolean favorite(Long id, Instant createdAt, Long user) {
		return persistence.database().perform(() -> {
			var x = persistence.database().index("User.favoriteList").insert(new Object[] { id, user }, null);
			persistence.database().index("Article.favoriteList").insert(new Object[] { user, createdAt.toString(), id },
					null);
			return x;
		}, true);
	}

	public boolean unfavorite(Long id, Instant createdAt, Long user) {
		return persistence.database().perform(() -> {
			var x = persistence.database().index("User.favoriteList").delete(new Object[] { id, user }, null);
			persistence.database().index("Article.favoriteList").delete(new Object[] { user, createdAt.toString(), id },
					null);
			return x;
		}, true);
	}

//	@Override
//	protected void updateIndex(IndexBTree index, Map<Object, Object> remove, Map<Object, Object> add) {
//		persistence.database().perform(() -> {
//			super.updateIndex(index, remove, add);

//			if (name != null && name.equals("Article.tagList")) {
//				var m = new LinkedHashMap<String, long[]>();
//				{
//					var i = persistence.database().index("Article.tagList");
//					if (remove != null)
//						for (var x : remove.keySet()) {
//							var c = i.count(x);
//							m.put((String) x, new long[] { c + 1, c });
//						}
//					if (add != null)
//						for (var x : add.keySet()) {
//							var c = i.count(x);
//							m.put((String) x, new long[] { c - 1, c });
//						}
//				}
//				if (!m.isEmpty()) {
//					var i = persistence.database().index("Tag.count");
//					for (var x : m.entrySet()) {
//						var t = x.getKey();
//						var c = x.getValue();
	//// IO.println( "ArticleCrud.updateIndex, Tag.count, t=" + t + ", c="
	/// + Arrays.toString(c));
//						if (c[0] > 0)
//							i.delete(new Object[] { c[0], t }, null);
//						if (c[1] > 0)
//							i.insert(new Object[] { c[1], t }, null);
//					}
//				}
//			}
//			return null;
//		}, true);
//	}

	@Override
	protected void updateIndexes(Article entity1, Article entity2) {
		super.updateIndexes(entity1, entity2);

		var dd = Stream.of(entity1, entity2).filter(Objects::nonNull).flatMap(x -> x.tagList().stream())
				.collect(Collectors.toMap(x -> x, _ -> 0, (x, _) -> x, LinkedHashMap::new));
		if (entity1 != null)
			for (var t : entity1.tagList())
				dd.compute(t, (_, x) -> x - 1);
		if (entity2 != null)
			for (var t : entity2.tagList())
				dd.compute(t, (_, x) -> x + 1);
		var i = persistence.database().index("TagCount", "table");
		dd.entrySet().forEach(td -> {
			var t = td.getKey();
			var d = td.getValue().intValue();
			if (d != 0) {
				var k = new Object[] { toDatabaseValue(t) };
				var a = new int[1];
				i.delete(k, x -> x.forEach(y -> a[0] = fromDatabaseValue(y.reduce((_, z) -> z).get(), Integer.class)));
				a[0] = a[0] + d;
				i.insert(k, new Object[] { toDatabaseValue(a[0]) });
			}
		});
	}
}
