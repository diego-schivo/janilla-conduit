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
import java.util.Iterator;
import java.util.Properties;

import com.janilla.http.HttpExchange;
import com.janilla.json.JsonToken;
import com.janilla.persistence.Persistence;
import com.janilla.web.JsonHandlerFactory;

public class CustomJsonHandlerFactory extends JsonHandlerFactory {

	Properties configuration;

	Persistence persistence;

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	public void setPersistence(Persistence persistence) {
		this.persistence = persistence;
	}

	@Override
	protected void render(Object object, HttpExchange exchange) throws IOException {
		var o = configuration.getProperty("conduit.api.cors.origin");
		exchange.getResponse().getHeaders().set("Access-Control-Allow-Origin", o);

		super.render(object, exchange);
	}

	@Override
	protected Iterator<JsonToken<?>> newJsonIterator(Object object, HttpExchange exchange) {
		var i = new CustomReflectionJsonIterator();
		i.setObject(object);
		i.persistence = persistence;
		i.user = ((ConduitBackendApp.Exchange) exchange).user;
		return i;
	}
}
