/**
 * seat_allocator.c
 * Módulo C para lógica de alocação e cálculo de disponibilidade de assentos
 * Compilar: gcc -fPIC -shared -o libseat_allocator.so seat_allocator.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

/**
 * Estrutura para representar um assento
 */
typedef struct {
    int id;
    int row;
    char column;
    int status; // 0=available, 1=occupied, 2=reserved
    int seatClass; // 0=economy, 1=business, 2=first
} Seat;

/**
 * Estrutura para representar resultado de operação
 */
typedef struct {
    int success;
    int resultCode;
    char message[256];
} OperationResult;

/**
 * Calcula o número total de assentos disponíveis em um array de assentos
 * @param seats Array de assentos
 * @param seatCount Número total de assentos
 * @return Número de assentos disponíveis
 */
int count_available_seats(Seat* seats, int seatCount) {
    if (seats == NULL || seatCount <= 0) {
        return 0;
    }
    
    int available = 0;
    for (int i = 0; i < seatCount; i++) {
        if (seats[i].status == 0) { // 0 = available
            available++;
        }
    }
    return available;
}

/**
 * Encontra um assento disponível de uma classe específica
 * @param seats Array de assentos
 * @param seatCount Número total de assentos
 * @param seatClass Classe desejada (0=economy, 1=business, 2=first)
 * @return ID do assento encontrado, ou -1 se nenhum disponível
 */
int find_available_seat(Seat* seats, int seatCount, int seatClass) {
    if (seats == NULL || seatCount <= 0) {
        return -1;
    }
    
    // Busca por um assento disponível da classe especificada
    for (int i = 0; i < seatCount; i++) {
        if (seats[i].status == 0 && seats[i].seatClass == seatClass) {
            return seats[i].id;
        }
    }
    
    return -1; // Nenhum assento disponível
}

/**
 * Reserva um assento específico
 * @param seats Array de assentos
 * @param seatCount Número total de assentos
 * @param seatId ID do assento a reservar
 * @return 1 se sucesso, 0 se falha
 */
int reserve_seat(Seat* seats, int seatCount, int seatId) {
    if (seats == NULL || seatCount <= 0 || seatId < 0) {
        return 0;
    }
    
    for (int i = 0; i < seatCount; i++) {
        if (seats[i].id == seatId) {
            if (seats[i].status == 0) { // Apenas se disponível
                seats[i].status = 2; // 2 = reserved
                return 1;
            }
            return 0; // Assento não disponível
        }
    }
    
    return 0; // Assento não encontrado
}

/**
 * Libera um assento (cancela reserva)
 * @param seats Array de assentos
 * @param seatCount Número total de assentos
 * @param seatId ID do assento a liberar
 * @return 1 se sucesso, 0 se falha
 */
int release_seat(Seat* seats, int seatCount, int seatId) {
    if (seats == NULL || seatCount <= 0 || seatId < 0) {
        return 0;
    }
    
    for (int i = 0; i < seatCount; i++) {
        if (seats[i].id == seatId) {
            if (seats[i].status == 2) { // Apenas se reservado
                seats[i].status = 0; // 0 = available
                return 1;
            }
            return 0;
        }
    }
    
    return 0;
}

/**
 * Calcula estatísticas de ocupação
 * @param seats Array de assentos
 * @param seatCount Número total de assentos
 * @param out_available Ponteiro para armazenar assentos disponíveis
 * @param out_occupied Ponteiro para armazenar assentos ocupados
 * @param out_reserved Ponteiro para armazenar assentos reservados
 * @return 1 se sucesso
 */
int calculate_occupancy_stats(Seat* seats, int seatCount, 
                              int* out_available, int* out_occupied, int* out_reserved) {
    if (seats == NULL || seatCount <= 0) {
        return 0;
    }
    
    int available = 0, occupied = 0, reserved = 0;
    
    for (int i = 0; i < seatCount; i++) {
        switch (seats[i].status) {
            case 0: available++; break;  // available
            case 1: occupied++; break;   // occupied
            case 2: reserved++; break;   // reserved
        }
    }
    
    *out_available = available;
    *out_occupied = occupied;
    *out_reserved = reserved;
    
    return 1;
}

/**
 * Valida a configuração de assentos (verifica se IDs são únicos)
 * @param seats Array de assentos
 * @param seatCount Número total de assentos
 * @return 1 se válido, 0 se inválido
 */
int validate_seat_configuration(Seat* seats, int seatCount) {
    if (seats == NULL || seatCount <= 0) {
        return 0;
    }
    
    // Verifica se há IDs duplicados
    for (int i = 0; i < seatCount; i++) {
        for (int j = i + 1; j < seatCount; j++) {
            if (seats[i].id == seats[j].id) {
                return 0; // ID duplicado
            }
        }
    }
    
    return 1; // Configuração válida
}

/**
 * Encontra o melhor assento disponível (preferência: meio da fileira, classe especificada)
 * @param seats Array de assentos
 * @param seatCount Número total de assentos
 * @param seatClass Classe desejada
 * @param seatsPerRow Assentos por fileira
 * @return ID do melhor assento, ou -1 se nenhum disponível
 */
int find_best_seat(Seat* seats, int seatCount, int seatClass, int seatsPerRow) {
    if (seats == NULL || seatCount <= 0 || seatsPerRow <= 0) {
        return -1;
    }
    
    int bestSeatId = -1;
    int bestScore = -1;
    
    for (int i = 0; i < seatCount; i++) {
        if (seats[i].status == 0 && seats[i].seatClass == seatClass) {
            // Calcula score: assentos no meio da fileira têm score mais alto
            int positionInRow = (seats[i].column - 'A') % seatsPerRow;
            int middlePos = seatsPerRow / 2;
            int score = seatsPerRow - abs(positionInRow - middlePos);
            
            if (score > bestScore) {
                bestScore = score;
                bestSeatId = seats[i].id;
            }
        }
    }
    
    return bestSeatId;
}
