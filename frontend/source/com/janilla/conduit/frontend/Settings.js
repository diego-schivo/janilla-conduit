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

class Settings {

	selector;

	title = 'Settings';

	engine;

	errors;

	render = async e => {
		return await e.match([this], (i, o) => {
			this.engine = e.clone();
			o.template = 'Settings';
		}) || await e.match([this, 'errors'], (i, o) => {
			this.errors = new Errors();
			this.errors.selector = () => this.selector().querySelector('form').previousElementSibling;
			o.value = this.errors;
		});
	}

	listen = () => {
		this.selector().querySelector('form').addEventListener('submit', this.handleSubmit);
		this.selector().querySelector('form ~ button').addEventListener('click', this.handleLogoutClick);
	}

	handleSubmit = async e => {
		e.preventDefault();
		const a = this.engine.app.api;
		const s = await fetch(`${a.url}/user`, {
			method: 'PUT',
			headers: { ...a.headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ user: Object.fromEntries(new FormData(e.currentTarget)) })
		});
		const j = await s.json();
		this.errors.messages = s.ok ? null : j;
		await this.errors.refresh();
		if (s.ok) {
			this.engine.app.currentUser = j.user;
			location.hash = `#/@${this.engine.app.currentUser.username}`;
		}
	}

	handleLogoutClick = async e => {
		e.preventDefault();
		dispatchEvent(new CustomEvent('currentuserchange', {
			detail: { user: null }
		}));
		location.hash = '#/';
	}
}

export default Settings;
