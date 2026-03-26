package com.moni.configuration;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Objects;

import com.moni.configuration.exception.AcessoNegadoException;
import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.configuration.exception.EmailJaCadastradoException;
import com.moni.configuration.exception.MetaNaoEncontradaException;
import com.moni.configuration.exception.TransacaoNaoEncontradaException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErroApiResponse> tratarErroValidacao(MethodArgumentNotValidException exception) {
		String mensagem = exception.getBindingResult().getFieldErrors().stream()
				.map(FieldError::getDefaultMessage)
				.filter(Objects::nonNull)
				.findFirst()
				.orElse("Dados de entrada invalidos.");

		return resposta(HttpStatus.BAD_REQUEST, mensagem);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErroApiResponse> tratarJsonMalformado(HttpMessageNotReadableException exception) {
		return resposta(HttpStatus.BAD_REQUEST, "Corpo da requisicao invalido.");
	}

	@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
	public ResponseEntity<ErroApiResponse> tratarTipoMidiaInvalido(HttpMediaTypeNotSupportedException exception) {
		return resposta(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Content-Type nao suportado.");
	}

	@ExceptionHandler(EmailJaCadastradoException.class)
	public ResponseEntity<ErroApiResponse> tratarEmailDuplicado(EmailJaCadastradoException exception) {
		return resposta(HttpStatus.CONFLICT, exception.getMessage());
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ErroApiResponse> tratarViolacaoIntegridade(DataIntegrityViolationException exception) {
		return resposta(HttpStatus.CONFLICT, "E-mail ja cadastrado.");
	}

	@ExceptionHandler(CredenciaisInvalidasException.class)
	public ResponseEntity<ErroApiResponse> tratarCredenciaisInvalidas(CredenciaisInvalidasException exception) {
		return resposta(HttpStatus.UNAUTHORIZED, exception.getMessage());
	}

	@ExceptionHandler(AcessoNegadoException.class)
	public ResponseEntity<ErroApiResponse> tratarAcessoNegado(AcessoNegadoException exception) {
		return resposta(HttpStatus.FORBIDDEN, exception.getMessage());
	}

	@ExceptionHandler(TransacaoNaoEncontradaException.class)
	public ResponseEntity<ErroApiResponse> tratarTransacaoNaoEncontrada(TransacaoNaoEncontradaException exception) {
		return resposta(HttpStatus.NOT_FOUND, exception.getMessage());
	}

	@ExceptionHandler(MetaNaoEncontradaException.class)
	public ResponseEntity<ErroApiResponse> tratarMetaNaoEncontrada(MetaNaoEncontradaException exception) {
		return resposta(HttpStatus.NOT_FOUND, exception.getMessage());
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ErroApiResponse> tratarParametroInvalido(MethodArgumentTypeMismatchException exception) {
		return resposta(HttpStatus.BAD_REQUEST, "Parametro de requisicao invalido.");
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ErroApiResponse> tratarRegraNegocioInvalida(IllegalArgumentException exception) {
		return resposta(HttpStatus.BAD_REQUEST, exception.getMessage());
	}

	private ResponseEntity<ErroApiResponse> resposta(HttpStatus status, String mensagem) {
		ErroApiResponse erro = new ErroApiResponse(
				OffsetDateTime.now(ZoneOffset.UTC).toString(),
				status.value(),
				status.getReasonPhrase(),
				mensagem);

		return ResponseEntity.status(status).body(erro);
	}
}