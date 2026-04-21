package com.example.demoapi;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class HelloController {

    @GetMapping("/hello")
    public String sayHello() {
        return "Javaのバックエンドからこんにちは！Reactとの連携に成功しましたね！";
    }
    // 数字の足し算を行う新しい窓口
    @GetMapping("/add")
    public int addNumbers(@RequestParam int num1, @RequestParam int num2) {
        System.out.println("計算リクエストを受け付けました右の数字をreturnします。: " + num1 + " + " + num2);
        return num1 + num2;
    }
}