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

import java.util.Comparator;
import java.util.List;
import java.util.Properties;
import java.util.function.Function;

import com.janilla.http.HttpExchange;
import com.janilla.http.HttpHandlerFactory;
import com.janilla.web.Invocable;
import com.janilla.web.Invocation;
import com.janilla.web.InvocationHandlerFactory;
import com.janilla.web.RenderableFactory;

public class CustomInvocationHandlerFactory extends InvocationHandlerFactory {

	public Properties configuration;

	public CustomInvocationHandlerFactory(List<Invocable> invocables, Function<Class<?>, Object> instanceResolver,
			Comparator<Invocation> invocationComparator, RenderableFactory renderableFactory,
			HttpHandlerFactory rootFactory) {
		super(invocables, instanceResolver, invocationComparator, renderableFactory, rootFactory);
	}

	@Override
	protected boolean handle(Invocation invocation, HttpExchange exchange) {
		exchange.response().setHeaderValue("access-control-allow-origin",
				configuration.getProperty("conduit.api.cors.origin"));

//		if (exchange.request().getPath().startsWith("/api/"))
//			try {
//				Thread.sleep(1500);
//			} catch (InterruptedException e) {
//				e.printStackTrace();
//			}

		return super.handle(invocation, exchange);
	}

//	@Override
//	protected Object resolveArgument(Type type, HttpExchange exchange, String[] values,
//			Java.EntryList<String, String> entries, Supplier<String> body, Supplier<TypeResolver> resolver) {
//		return type == User.class ? ((CustomHttpExchange) exchange).getUser()
//				: super.resolveArgument(type, exchange, values, entries, body, resolver);
//	}

	protected List<String> handleMethods(String path) {
		return invocationGroups(path).flatMap(x -> x.methods().keySet().stream()).toList();
	}
}
