package com.janilla.conduit.backend;

import java.util.AbstractMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import com.janilla.http.HttpServer;
import com.janilla.json.JsonToken;
import com.janilla.json.ReflectionJsonIterator;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Reflection;

public class CustomReflectionJsonIterator extends ReflectionJsonIterator {

		protected final Properties configuration;

		protected final Persistence persistence;

//		protected final Supplier<User> user;

		public CustomReflectionJsonIterator(Object object, boolean includeType, Properties configuration,
				Persistence persistence) { // , Supplier<User> user) {
			super(object, includeType);
//			this.user = user;
			this.configuration = configuration;
			this.persistence = persistence;
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
//						IO.println("k=" + k);
						var v = x.get(a);
						return new AbstractMap.SimpleImmutableEntry<>(x.name(), v);
					}).collect(LinkedHashMap::new, (x, y) -> x.put(y.getKey(), y.getValue()), Map::putAll);
//					var u = user.get();
					var u = ((CustomHttpExchange) HttpServer.HTTP_EXCHANGE.get()).getUser();
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
//					var v = user.get();
					var v = ((CustomHttpExchange) HttpServer.HTTP_EXCHANGE.get()).getUser();
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