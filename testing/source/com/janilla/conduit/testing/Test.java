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
package com.janilla.conduit.testing;

import java.io.IOException;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.util.concurrent.atomic.AtomicBoolean;

import com.janilla.conduit.fullstack.ConduitFullstack;
import com.janilla.web.Handle;

@Handle(path = "/test")
public class Test {

	public ConduitFullstack fullstack;

	static final AtomicBoolean ongoing = new AtomicBoolean();

	@Handle(method = "POST", path = "start")
	public void start() throws IOException {
//		IO.println("Test.start, this=" + this);
		if (ongoing.getAndSet(true))
			throw new RuntimeException();
		var fch = (FileChannel) fullstack.backend.persistence.database().channel().channel();
		try (var ch = Channels.newChannel(getClass().getResourceAsStream("conduit-test.database"))) {
			var s = fch.transferFrom(ch, 0, Long.MAX_VALUE);
			fch.truncate(s);
		}
	}

	@Handle(method = "POST", path = "stop")
	public void stop() {
//		IO.println("Test.stop, this=" + this);
		if (!ongoing.getAndSet(false))
			throw new RuntimeException();
	}
}
