package com.janilla.conduit.backend;

import com.janilla.util.Util;
import com.janilla.web.ApplicationHandlerBuilder;
import com.janilla.web.ExceptionHandlerFactory;
import com.janilla.web.JsonHandlerFactory;
import com.janilla.web.MethodHandlerFactory;
import com.janilla.web.TemplateHandlerFactory;

public class CustomApplicationHandlerBuilder extends ApplicationHandlerBuilder {

//	ConduitBackend backend;

	@Override
	protected MethodHandlerFactory buildMethodHandlerFactory() {
		var f = new MethodHandlerFactory();

		var i = new CustomAnnotationDrivenToInvocation();
		i.setTypes(() -> Util.getPackageClasses(application.getClass().getPackageName()));
		i.backend = (ConduitBackend) application;
		f.setToInvocation(i);

		var r = new CustomMethodArgumentsResolver();
		r.backend = (ConduitBackend) application;
		f.setArgumentsResolver(r);

		return f;
	}

	@Override
	protected TemplateHandlerFactory buildTemplateHandlerFactory() {
		return null;
	}

	@Override
	protected JsonHandlerFactory buildJsonHandlerFactory() {
		var f = new CustomJsonHandlerFactory();
		f.backend = (ConduitBackend) application;
		return f;
	}

	@Override
	protected ExceptionHandlerFactory buildExceptionHandlerFactory() {
		return new CustomExceptionHandlerFactory();
	}
}
