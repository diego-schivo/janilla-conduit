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

import java.util.Optional;
import java.util.Set;

import com.janilla.database.BTree;
import com.janilla.database.Database;
import com.janilla.database.KeyAndData;
import com.janilla.io.ByteConverter;
import com.janilla.json.MapAndType.TypeResolver;
import com.janilla.persistence.Crud;
import com.janilla.persistence.Entity;
import com.janilla.persistence.Persistence;

public class CustomPersistence extends Persistence {

	public CustomPersistence(Database database, Set<Class<? extends Entity<?>>> types, TypeResolver typeResolver) {
		super(database, types, typeResolver);
	}

	@Override
	public <K, V> com.janilla.database.Index<K, V> newIndex(KeyAndData<String> keyAndData) {
		@SuppressWarnings("unchecked")
		var x = Optional.ofNullable((com.janilla.database.Index<K, V>) super.newIndex(keyAndData))
				.orElseGet(() -> (com.janilla.database.Index<K, V>) switch (keyAndData.key()) {
				case "User.favoriteList",
						"User.followList" ->
					new com.janilla.database.Index<Long, Long>(
							new BTree<>(database.bTreeOrder(), database.channel(), database.memory(),
									KeyAndData.getByteConverter(ByteConverter.LONG), keyAndData.bTree()),
							ByteConverter.LONG);
				case "Tag.count" ->
					new com.janilla.database.Index<Object[], String>(
							new BTree<>(database.bTreeOrder(), database.channel(), database.memory(),
									KeyAndData.getByteConverter(ByteConverter.of(new ByteConverter.TypeAndOrder(
											Long.class, ByteConverter.SortOrder.DESCENDING))),
									keyAndData.bTree()),
							ByteConverter.STRING);
				case "Article.favoriteList" -> new com.janilla.database.Index<Long, Object[]>(
						new BTree<>(database.bTreeOrder(), database.channel(), database.memory(),
								KeyAndData.getByteConverter(ByteConverter.LONG), keyAndData.bTree()),
						ByteConverter.of(Article.class, "-createdAt", "id"));
				default -> null;
				});
		return x;
	}

	@Override
	protected void createStoresAndIndexes() {
		super.createStoresAndIndexes();
		for (var x : new String[] { "Article.favoriteList", "Tag.count", "User.favoriteList", "User.followList" })
			database.perform((_, ii) -> {
				ii.create(x);
				return null;
			}, true);
	}

	@SuppressWarnings("unchecked")
	@Override
	protected <E extends Entity<?>> Crud<?, E> newCrud(Class<E> type) {
		if (type == Article.class)
			return (Crud<?, E>) new ArticleCrud(this);
		if (type == User.class)
			return (Crud<?, E>) new UserCrud(this);
		return super.newCrud(type);
	}
}
