package com.capstone.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Setter;

@Setter
public class SignupRequest {

    @NotBlank(message = "성을 입력해주세요.")
    private String lastName;

    @NotBlank(message = "이름을 입력해주세요.")
    private String firstName;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    private String password;

    @NotBlank(message = "의사 면허번호를 입력해주세요.")
    private String licenseNumber;

    @NotBlank(message = "소속 병원을 입력해주세요.")
    private String hospital;

    @NotBlank(message = "진료과를 입력해주세요.")
    private String department;

    private String status;

    public String getLastName() {
        return lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public String getHospital() {
        return hospital;
    }

    public String getDepartment() {
        return department;
    }

    public String getStatus() {
        return status;
    }
}
