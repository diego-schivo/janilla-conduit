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

	render = async e => {
		return await e.match([this], async (i, o) => {
			this.engine = e.clone();
			if (this.slug) {
				const a = e.app.api;
				const s = await fetch(`${a.url}/articles/${this.slug}`, {
					headers: a.headers
				});
				this.article = s.ok ? (await s.json()).article : null;
			} else
				this.article = null;
			o.template = 'Editor';
		}) || await e.match([this, 'errors'], (i, o) => {
			this.errors = new Errors();
			this.errors.selector = () => this.selector().querySelector('form').previousElementSibling;
			o.value = this.errors;
		}) || await e.match([this, 'tags'], (i, o) => {
			this.tags = new TagsInput();
			this.tags.selector = () => this.selector().querySelector('button').previousElementSibling;
			o.value = this.tags;
		}) || await e.match([this, 'tagList'], (i, o) => {
			o.value = this.article?.tagList;
		});
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

class TagsInput {

	selector;
	
	engine;

	render = async e => {
		return await e.match([this], (i, o) => {
			this.engine = e.clone();
			o.template = 'TagsInput';
		}) || await e.match([this, 'tagList', 'number'], (i, o) => {
			o.template = 'TagsInput-tag';
		});
	}

	listen = () => {
		const i = this.selector().firstElementChild;
		i.addEventListener('keydown', this.handleInputKeyDown);
		i.nextElementSibling.addEventListener('click', this.handleCloseClick);
	}

	handleCloseClick = e => {
		const i = e.target.closest('.ion-close-round');
		if (!i)
			return;
		e.preventDefault();
		i.closest('.tag-default').remove();
	}

	handleInputKeyDown = async e => {
		if (e.key !== 'Enter')
			return;
		e.preventDefault();
		const i = e.currentTarget;
		const d = i.nextElementSibling;
		if (!d.querySelector(`[value="${i.value}"]`)) {
			const h = await this.engine.render(i.value, 'TagsInput-tag');
			d.insertAdjacentHTML('beforeend', h);
		}
		i.value = '';
	}
}

export default Editor;
