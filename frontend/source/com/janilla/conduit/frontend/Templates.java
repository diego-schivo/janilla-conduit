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
package com.janilla.conduit.frontend;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.UncheckedIOException;
import java.util.Arrays;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.janilla.io.IO;
import com.janilla.util.Evaluator;
import com.janilla.util.Interpolator;
import com.janilla.util.Lazy;
import com.janilla.web.Handle;
import com.janilla.web.Render;

public class Templates {

	Supplier<Template[]> templates = Lazy.of(() -> {
		var b = Stream.<Template>builder();
		IO.acceptPackageFiles("com.janilla.conduit.frontend", f -> {
			var n = f.getFileName().toString();
			if (!n.endsWith(".html"))
				return;
			n = n.substring(0, n.length() - ".html".length());
			if (switch (n) {
			case "conduit", "head" -> true;
			default -> false;
			})
				return;
			var o = new ByteArrayOutputStream();
			try (var t = ConduitFrontend.class.getResourceAsStream(n + ".html"); var w = new PrintWriter(o)) {
				if (t == null)
					throw new NullPointerException(n);
				var i = new Interpolator();
				i.setEvaluators(Stream.of('#', '$').collect(Collectors.toMap(Function.identity(), c -> new Evaluator() {

					@Override
					public Object apply(String expression) {
						return "${await r('" + expression + "', " + (c.charValue() == '$') + ")}";
					}
				})));
				try (var r = new BufferedReader(new InputStreamReader(t))) {
					for (var j = r.lines().iterator(); j.hasNext();)
						i.println(j.next(), w);
				}
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}

			var h = o.toString();
			var u = new Template(n, h);
			b.add(u);
		});
		return b.build().toArray(Template[]::new);
	});

	@Handle(method = "GET", uri = "/templates.js")
	public Script getScript() {
		return new Script(Arrays.stream(templates.get()));
	}

	@Render(template = """
			export default {
			  ${entries}
			};""")
	public record Script(Stream<Template> entries) {
	}

	@Render(template = """
			  '${name}': async r => `
			#{html}
			  `,""")
	public record Template(String name, String html) {
	}
}
