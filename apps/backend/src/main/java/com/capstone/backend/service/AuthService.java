package com.capstone.backend.service;

import com.capstone.backend.domain.UserAccount;
import com.capstone.backend.dto.AuthResponse;
import com.capstone.backend.dto.LoginRequest;
import com.capstone.backend.dto.SignupRequest;
import com.capstone.backend.repository.UserAccountRepository;
import com.capstone.backend.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
        UserAccountRepository userAccountRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        validateCredentials(request.getEmail(), request.getPassword());

        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        UserAccount user = new UserAccount(
            request.getEmail(),
            passwordEncoder.encode(request.getPassword()),
            request.getLicenseNumber(),
            request.getHospital(),
            request.getDepartment(),
            resolveSignupStatus(request.getStatus())
        );
        userAccountRepository.save(user);

        String token = jwtTokenProvider.createToken(user.getEmail());
        return new AuthResponse(token, jwtTokenProvider.getJwtExpirationMs(), user.getEmail());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        validateCredentials(request.getEmail(), request.getPassword());

        UserAccount user = userAccountRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtTokenProvider.createToken(user.getEmail());
        return new AuthResponse(token, jwtTokenProvider.getJwtExpirationMs(), user.getEmail());
    }

    private void validateCredentials(String email, String password) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }
    }

    private String resolveSignupStatus(String requestedStatus) {
        if (requestedStatus == null || requestedStatus.isBlank()) {
            return "PENDING";
        }
        return requestedStatus;
    }
}
