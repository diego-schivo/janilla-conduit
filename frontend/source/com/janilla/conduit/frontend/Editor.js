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
import Errors from './Errors.js';
import TagsInput from './TagsInput.js';

class Editor {

	selector;

	title = 'Editor';

	article;

	engine;

	errors;

	tags;

	get slug() {
		return location.hash.split('/')[2];
	}

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			if (this.slug) {
				const a = engine.app.api;
				const s = await fetch(`${a.url}/articles/${this.slug}`, {
					headers: a.headers
				});
				this.article = s.ok ? (await s.json()).article : null;
			} else
				this.article = null;
			return await engine.render(this, 'Editor');
		}

		if (engine.isRendering(this, 'errors')) {
			this.errors = new Errors();
			this.errors.selector = () => this.selector().querySelector('form').previousElementSibling;
			return this.errors;
		}

		if (engine.isRendering(this, 'tags')) {
			this.tags = new TagsInput();
			this.tags.selector = () => this.selector().querySelector('button').previousElementSibling;
			return this.tags;
		}

		if (engine.isRendering(this, 'tagList')) {
			return this.article?.tagList;
		}
	}

	listen = () => {
		this.selector().querySelector('form').addEventListener('submit', this.handleSubmit);
		this.tags.listen();
	}

	handleSubmit = async e => {
		e.preventDefault();
		const a = {};
		new FormData(e.currentTarget).forEach((v, k) => {
			switch (k) {
				case 'tagList':
					if (!a[k]) a[k] = [];
					a[k].push(v);
					break;
				default:
					a[k] = v;
					break;
			}
		});
		const b = this.engine.app.api;
		const s = await fetch(this.slug ? `${b.url}/articles/${this.slug}` : `${b.url}/articles`, {
			method: this.slug ? 'PUT' : 'POST',
			headers: { ...b.headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ article: a })
		});
		const j = await s.json();
		this.errors.messages = s.ok ? null : j;
		await this.errors.refresh();
		if (s.ok)
			location.hash = `#/article/${j.article.slug}`;
	}
}

export default Editor;
