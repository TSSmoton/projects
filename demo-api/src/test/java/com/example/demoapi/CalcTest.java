package com.example.demoapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

// テストクラスはこれだけでOKです！
class CalcTest {

    @Test
    void 足し算が正しいこと() {
        // HelloControllerを呼び出してテストする
        HelloController controller = new HelloController();
        int result = controller.addNumbers(10, 20);
        
        // 結果が 30 になっているかチェック
        assertEquals(30, result);
    }
}