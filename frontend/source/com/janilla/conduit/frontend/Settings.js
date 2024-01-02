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

	conduit;

	errors;

	title = 'Settings';

	render = async key => {
		const r = this.conduit.rendering;
		const t = this.conduit.templates;

		switch (key) {
			case undefined:
				return await r.render(this, t['Settings']);

			case 'errors':
				this.errors = new Errors();
				this.errors.conduit = this.conduit;
				return this.errors;
		}

		/*
		if (typeof key === 'string' && Object.hasOwn(this.conduit.user, key))
			return this.conduit.user[key];
		*/
	}

	listen = () => {
		document.querySelector('form').addEventListener('submit', this.handleFormSubmit);
		document.querySelector('button[name="logout"]').addEventListener('click', this.handleLogoutClick);
	}

	handleFormSubmit = async e => {
		e.preventDefault();
		const s = await fetch(`${this.conduit.backendUrl}/api/user`, {
			method: 'PUT',
			headers: { ...this.conduit.backendHeaders, 'Content-Type': 'application/json' },
			body: JSON.stringify({ user: Object.fromEntries(new FormData(e.currentTarget)) })
		});
		const j = await s.json();
		if (s.ok) {
			this.conduit.user = j.user;
			location.hash = `#/@${this.conduit.user.username}`;
		} else
			await this.errors.refresh(j);
	}

	handleLogoutClick = async e => {
		e.preventDefault();
		window.dispatchEvent(new CustomEvent('userchange', {
			detail: { user: null }
		}));
		location.hash = '#/';
	}
}

export default Settings;
