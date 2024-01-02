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

	article;

	errors;

	tagsControl;

	title = 'Editor';

	get slug() {
		return location.hash.split('/')[2];
	}

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		switch (key) {
			case undefined:
				if (this.slug) {
					const s = await fetch(`${this.conduit.backendUrl}/api/articles/${this.slug}`, {
						headers: this.conduit.backendHeaders
					});
					if (s.ok)
						this.article = (await s.json()).article;
				} else
					delete this.article;
				return await r.render(this, t['Editor']);

			case 'errors':
				this.errors = new Errors();
				this.errors.conduit = this.conduit;
				return this.errors;

			case 'tags':
				this.tagsControl = new TagsInput();
				this.tagsControl.conduit = this.conduit;
				return this.tagsControl;
		}
	}

	listen = () => {
		document.querySelector('form').addEventListener('submit', this.handleFormSubmit);
		this.tagsControl.listen();
	}

	handleFormSubmit = async e => {
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
		const s = await fetch(this.slug ? `${this.conduit.backendUrl}/api/articles/${this.slug}` : `${this.conduit.backendUrl}/api/articles`, {
			method: this.slug ? 'PUT' : 'POST',
			headers: { ...this.conduit.backendHeaders, 'Content-Type': 'application/json' },
			body: JSON.stringify({ article: a })
		});
		const j = await s.json();
		if (s.ok)
			location.hash = `#/article/${j.article.slug}`;
		else
			await this.errors.refresh(j);
	}
}

export default Editor;
