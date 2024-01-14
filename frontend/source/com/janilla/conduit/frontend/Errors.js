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
class Errors {

	#messages;

	rendering;
	
	get messages() {
		return this.#messages;
	}
	
	set messages(x) {
		this.#messages = x ? Object.entries(x).flatMap(([k, v]) => v.map(w => `${k} ${w}`)) : null;
	}

	render = async (key, rendering) => {
		if (key === undefined) {
			this.rendering = rendering.clone();
			return await rendering.render(this, 'Errors');
		}

		if (rendering.stack.at(-2).key === 'messages')
			return await rendering.render(this.messages[key], 'Errors-message');
	}

	refresh = async () => {
		const h = await this.rendering.render(this);
		this.selector().outerHTML = h;
	}
}

export default Errors;
