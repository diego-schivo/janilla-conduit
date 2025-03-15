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

import java.util.Collection;
import java.util.Optional;

import com.janilla.database.BTree;
import com.janilla.database.Database;
import com.janilla.database.KeyAndData;
import com.janilla.database.NameAndData;
import com.janilla.io.ByteConverter;
import com.janilla.persistence.Crud;
import com.janilla.persistence.Persistence;

public class CustomPersistence extends Persistence {

	public CustomPersistence(Database database, Collection<Class<?>> types) {
		super(database, types);
	}

	@Override
	public <K, V> com.janilla.database.Index<K, V> newIndex(NameAndData nameAndData) {
		@SuppressWarnings("unchecked")
		var i = Optional.ofNullable((com.janilla.database.Index<K, V>) super.newIndex(nameAndData))
				.orElseGet(() -> (com.janilla.database.Index<K, V>) switch (nameAndData.name()) {
				case "User.favoriteList",
						"User.followList" ->
					new com.janilla.database.Index<Long, Long>(
							new BTree<>(database.bTreeOrder(), database.channel(), database.memory(),
									KeyAndData.getByteConverter(ByteConverter.LONG), nameAndData.bTree()),
							ByteConverter.LONG);
				case "Tag.count" ->
					new com.janilla.database.Index<Object[], String>(
							new BTree<>(database.bTreeOrder(), database.channel(), database.memory(),
									KeyAndData.getByteConverter(ByteConverter.of(new ByteConverter.TypeAndOrder(
											Long.class, ByteConverter.SortOrder.DESCENDING))),
									nameAndData.bTree()),
							ByteConverter.STRING);
				case "Article.favoriteList" -> new com.janilla.database.Index<Long, Object[]>(
						new BTree<>(database.bTreeOrder(), database.channel(), database.memory(),
								KeyAndData.getByteConverter(ByteConverter.LONG), nameAndData.bTree()),
						ByteConverter.of(Article.class, "-createdAt", "id"));
				default -> null;
				});
		return i;
	}

	@Override
	protected void createStoresAndIndexes() {
		super.createStoresAndIndexes();
		for (var n : new String[] { "Article.favoriteList", "Tag.count", "User.favoriteList", "User.followList" })
			database.perform((_, ii) -> {
				ii.create(n);
				return null;
			}, true);
	}

	@Override
	protected <E> Crud<E> newCrud(Class<E> type) {
		if (type == Article.class) {
			@SuppressWarnings("unchecked")
			var c = (Crud<E>) new ArticleCrud(this);
			return c;
		}
		if (type == User.class) {
			@SuppressWarnings("unchecked")
			var c = (Crud<E>) new UserCrud(this);
			return c;
		}
		return super.newCrud(type);
	}
}
