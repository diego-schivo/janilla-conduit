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
import Editor from './Editor.js';
import Home from './Home.js';
import Layout from './Layout.js';
import Login from './Login.js';
import Profile from './Profile.js';
import Register from './Register.js';
import RenderEngine from './RenderEngine.js';
import Settings from './Settings.js';

class ConduitApp {

	selector = () => document.body.firstElementChild;

	api = {
		url: this.selector().dataset.apiUrl,
		headers: {}
	};

	layout;

	pages = {
		'': () => new Home(),
		'article': () => new Article(),
		'editor': () => new Editor(),
		'login': () => new Login(),
		'profile': () => new Profile(),
		'register': () => new Register(),
		'settings': () => new Settings()
	};

	currentPage;

	currentUser;

	get jwtToken() {
		return localStorage.getItem('jwtToken');
	}

	set jwtToken(x) {
		if (x)
			localStorage.setItem('jwtToken', x);
		else
			localStorage.removeItem('jwtToken');
	}

	run = async () => {
		const t = this.jwtToken;
		if (t) {
			const s = await fetch(`${this.api.url}/user`, {
				headers: { Authorization: `Token ${t}` }
			});
			this.currentUser = s.ok ? (await s.json()).user : null;
			this.api.headers['Authorization'] = this.currentUser ? `Token ${this.currentUser.token}` : '';
		}

		addEventListener('hashchange', this.handleHashChange);
		if (!location.hash)
			location.hash = '#/';
		else
			this.handleHashChange();
	}

	render = async e => {
		return await e.match([this], (i, o) => {
			o.template = 'ConduitApp';
		}) || await e.match([this, 'layout'], (i, o) => {
			this.layout = new Layout();
			this.layout.selector = this.selector;
			o.value = this.layout;
		}) || await e.match(['createdAt'], (i, o) => {
			if (i[0])
				o.value = new Date(i[0]).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
		});
	}

	listen = () => {
		addEventListener('hashchange', this.handleHashChange);
		addEventListener('currentuserchange', this.handleCurrentUserChange);
		this.layout.listen();
	}

	handleHashChange = async () => {
		{
			const h = location.hash;
			const p = this.pages[h.startsWith('#/@') ? 'profile' : h.split('/')[1]]();
			this.currentPage && dispatchEvent(new CustomEvent('pageunload'));
			this.currentPage = p;
		}

		document.title = [this.currentPage?.title, 'Conduit'].filter(x => x).join(' \u2014 ');
		if (!this.currentPage)
			return;
		this.currentPage.selector = () => this.layout.selector().children[1];
		{
			const e = new CustomRenderEngine();
			const h = await e.render({ value: this });
			this.layout.selector().innerHTML = h;
			this.listen();
			dispatchEvent(new CustomEvent('pageload'));
		}
	}

	handleCurrentUserChange = async e => {
		this.currentUser = e.detail.user;
		this.jwtToken = this.currentUser?.token;
		this.api.headers['Authorization'] = this.currentUser ? `Token ${this.currentUser.token}` : '';
	}
}

class CustomRenderEngine extends RenderEngine {

	get app() {
		return this.stack[0].value;
	}

	clone() {
		const e = new CustomRenderEngine();
		e.stack = [...this.stack];
		return e;
	}
}

export default ConduitApp;
