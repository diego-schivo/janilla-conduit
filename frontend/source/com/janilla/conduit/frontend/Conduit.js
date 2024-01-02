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
import Article from './Article.js';
import ConduitRendering from './ConduitRendering.js';
import Editor from './Editor.js';
import Home from './Home.js';
import Layout from './Layout.js';
import Login from './Login.js';
import Profile from './Profile.js';
import Register from './Register.js';
import Settings from './Settings.js';
import templates from './templates.js';

class Conduit {

	backendUrl;

	layout = new Layout();

	pages = {
		'': new Home(),
		'article': new Article(),
		'editor': new Editor(),
		'login': new Login(),
		'profile': new Profile(),
		'register': new Register(),
		'settings': new Settings()
	};

	rendering = new ConduitRendering();

	templates = templates;

	token = localStorage.getItem('jwtToken');

	user;

	constructor() {
		[this.layout, ...Object.values(this.pages), this.rendering].forEach(o => o.conduit = this);
	}

	get backendHeaders() {
		return this.user ? { 'Authorization': `Token ${this.user.token}` } : {};
	}

	run = async () => {
		if (this.token) {
			const s = await fetch(`${this.backendUrl}/api/user`, {
				headers: { 'Authorization': `Token ${this.token}` }
			});
			if (s.ok)
				this.user = (await s.json()).user;
		}
		this.listen();
		if (location.hash) this.handleHashChange();
		else location.hash = '#/';
	}

	render = async key => {
		if (key === undefined)
			return this.layout;
	}

	listen = () => {
		window.addEventListener('hashchange', this.handleHashChange);
		window.addEventListener('userchange', this.handleUserChange);
		this.layout.listen();
	}

	handleHashChange = async () => {
		const h = location.hash;
		const p = this.pages[h.startsWith('#/@') ? 'profile' : h.split('/')[1]];
		document.title = p.title + ' \u2014 Conduit';
		this.layout.page = p;
		const r = this.rendering.renderer(this);
		document.querySelector('body > div').innerHTML = await r();
		this.listen();
	}

	handleUserChange = async e => {
		this.user = e.detail.user;
		if (this.user)
			localStorage.setItem('jwtToken', this.user.token);
		else
			localStorage.removeItem('jwtToken');
	}
}

export default Conduit;
