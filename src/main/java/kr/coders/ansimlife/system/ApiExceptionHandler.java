package kr.coders.ansimlife.system;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(basePackages = "kr.coders.ansimlife")
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleStatus(ResponseStatusException exception) {
        int status = exception.getStatusCode().value();
        // Only deliberate client-error reasons are public. Never expose internal
        // exception details, SQL, request contents or a server-error reason.
        String message = status < 500 && exception.getReason() != null
                ? exception.getReason() : "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.";
        return ResponseEntity.status(exception.getStatusCode()).body(new ApiError(status, message));
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<ApiError> handleInvalidInput(Exception exception) {
        return ResponseEntity.badRequest().body(new ApiError(400, "입력한 내용을 확인해주세요."));
    }

    public record ApiError(int status, String message) {}
}
