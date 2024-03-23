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
import RenderEngine from './RenderEngine.js';
import { TestBench } from './TestBench.js';

class ConduitTestingApp {

	testBench;

	run = async () => {
		const e = new RenderEngine();
		document.body.innerHTML = await e.render({ value: this });
		this.listen();
	}

	render = async e => {
		return await e.match([this], (i, o) => {
			o.template = 'ConduitTestingApp';
		}) || await e.match([this, 'testBench'], (i, o) => {
			this.testBench = new TestBench();
			this.testBench.selector = () => document.body.firstElementChild;
			o.value = this.testBench;
		});
	}

	listen = () => {
		this.testBench.listen();
	}
}

export default ConduitTestingApp;
